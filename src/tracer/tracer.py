# Tracer que corre dentro de Pyodide (y en CPython para los tests).
# Instrumenta la ejecución con sys.settrace y serializa el estado de las
# variables locales en cada paso. El JSON que emite es el contrato descrito
# en src/core/frame.ts — mantenlos sincronizados.

import sys, json, io

MAX_STEPS = 4000
MAX_ITEMS = 120
MAX_DEPTH = 4

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
    def __repr__(self):
        return 'ListNode(' + repr(self.val) + ')'

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
    def __repr__(self):
        return 'TreeNode(' + repr(self.val) + ')'

def build_list(vals):
    head = None
    for v in reversed(vals):
        head = ListNode(v, head)
    return head

def build_tree(vals):
    if not vals:
        return None
    nodes = [TreeNode(v) if v is not None else None for v in vals]
    kids = nodes[1:][::-1]
    for n in nodes:
        if n:
            if kids:
                n.left = kids.pop()
            if kids:
                n.right = kids.pop()
    return nodes[0]

def _scalar(v):
    if v is None or isinstance(v, (bool, int, str)):
        return v
    if isinstance(v, float):
        if v == v and v != float('inf') and v != float('-inf'):
            return v
        return repr(v)
    return repr(v)

def _is_scalar(v):
    return v is None or isinstance(v, (bool, int, float, str))

def serialize(v, depth=0):
    try:
        return _ser(v, depth)
    except Exception as e:
        return {'t': 'raw', 'v': '<error: ' + str(e) + '>'}

def _ser(v, depth):
    if _is_scalar(v):
        return {'t': 'scalar', 'v': _scalar(v)}
    if isinstance(v, ListNode):
        vals, seen, cycle = [], set(), False
        node = v
        while node is not None and len(vals) < 60:
            if id(node) in seen:
                cycle = True
                break
            seen.add(id(node))
            vals.append(_scalar(node.val))
            node = node.next
        return {'t': 'linkedlist', 'v': vals, 'cycle': cycle, 'trunc': node is not None and not cycle}
    if isinstance(v, TreeNode):
        out = []
        level = [v]
        d = 0
        while level and d < 6 and any(n is not None for n in level):
            nxt = []
            for n in level:
                out.append(_scalar(n.val) if n is not None else None)
                nxt.append(n.left if n else None)
                nxt.append(n.right if n else None)
            level = nxt
            d += 1
        while out and out[-1] is None:
            out.pop()
        return {'t': 'tree', 'v': out}
    if isinstance(v, (list, tuple)):
        if depth < MAX_DEPTH and 0 < len(v) <= MAX_ITEMS and all(isinstance(r, (list, tuple)) for r in v) \
                and all(all(_is_scalar(c) for c in r) for r in v) and any(len(r) > 0 for r in v):
            return {'t': 'matrix', 'v': [[_scalar(c) for c in r] for r in v]}
        items = [(_scalar(x) if _is_scalar(x) else _ser(x, depth + 1)) for x in list(v)[:MAX_ITEMS]]
        return {'t': 'list', 'v': items, 'trunc': len(v) > MAX_ITEMS, 'len': len(v)}
    if isinstance(v, dict):
        items = []
        for i, (k, val) in enumerate(v.items()):
            if i >= MAX_ITEMS:
                break
            items.append([_scalar(k) if _is_scalar(k) else repr(k),
                          _scalar(val) if _is_scalar(val) else _ser(val, depth + 1)])
        return {'t': 'dict', 'v': items, 'trunc': len(v) > MAX_ITEMS, 'len': len(v)}
    if isinstance(v, (set, frozenset)):
        try:
            items = sorted(v)
        except Exception:
            items = list(v)
        return {'t': 'set', 'v': [_scalar(x) if _is_scalar(x) else repr(x) for x in items[:MAX_ITEMS]],
                'trunc': len(v) > MAX_ITEMS, 'len': len(v)}
    if callable(v) or isinstance(v, type):
        return None
    return {'t': 'raw', 'v': repr(v)[:200]}

def run_trace(src):
    frames = []
    out_buf = []
    truncated = [False]

    class Out(io.TextIOBase):
        def write(self, s):
            out_buf.append(s)
            return len(s)

    def snapshot(frame, event, arg):
        loc = {}
        for name, val in frame.f_locals.items():
            if name.startswith('__') or name == 'self':
                continue
            if name in ('ListNode', 'TreeNode', 'build_list', 'build_tree', 'List', 'Optional', 'Dict', 'Set', 'Tuple'):
                continue
            s = serialize(val)
            if s is not None:
                loc[name] = s
        f = {'line': frame.f_lineno, 'event': event, 'func': frame.f_code.co_name,
             'locals': loc, 'out': len(''.join(out_buf))}
        if event == 'return':
            f['ret'] = serialize(arg)
        frames.append(f)

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != '<solution>':
            return None
        if event == 'exception':
            return tracer
        if len(frames) >= MAX_STEPS:
            truncated[0] = True
            sys.settrace(None)
            return None
        snapshot(frame, event, arg)
        return tracer

    from typing import List, Optional, Dict, Set, Tuple
    g = {'__name__': '__main__', 'ListNode': ListNode, 'TreeNode': TreeNode,
         'build_list': build_list, 'build_tree': build_tree,
         'List': List, 'Optional': Optional, 'Dict': Dict, 'Set': Set, 'Tuple': Tuple}
    error = None
    old_stdout = sys.stdout
    sys.stdout = Out()
    try:
        code = compile(src, '<solution>', 'exec')
        sys.settrace(tracer)
        try:
            exec(code, g)
        finally:
            sys.settrace(None)
    except Exception as e:
        error = type(e).__name__ + ': ' + str(e)
    finally:
        sys.stdout = old_stdout

    return json.dumps({'frames': frames, 'stdout': ''.join(out_buf),
                       'error': error, 'truncated': truncated[0]})
