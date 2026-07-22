/**
 * Ejemplos precargados del Top Interview 150.
 * Para agregar uno: añade un objeto al array (el orden define el orden de los chips).
 */

export interface Example {
  name: string;
  code: string;
  test: string;
}

export const EXAMPLES: readonly Example[] = [
  {
    name: 'Remove Duplicates II',
    code: `class Solution:
    def removeDuplicates(self, nums: List[int]) -> int:
        k = 2
        for i in range(2, len(nums)):
            if nums[i] != nums[k - 2]:
                nums[k] = nums[i]
                k += 1
        return k`,
    test: `nums = [1, 1, 1, 2, 2, 3]
resultado = Solution().removeDuplicates(nums)
print("k =", resultado)`,
  },
  {
    name: 'Merge Sorted Array',
    code: `class Solution:
    def merge(self, nums1, m, nums2, n):
        i, j, w = m - 1, n - 1, m + n - 1
        while j >= 0:
            if i >= 0 and nums1[i] > nums2[j]:
                nums1[w] = nums1[i]
                i -= 1
            else:
                nums1[w] = nums2[j]
                j -= 1
            w -= 1`,
    test: `nums1 = [1, 2, 3, 0, 0, 0]
nums2 = [2, 5, 6]
Solution().merge(nums1, 3, nums2, 3)`,
  },
  {
    name: 'Valid Anagram (dict)',
    code: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        if len(s) != len(t):
            return False
        count = {}
        for c in s:
            count[c] = count.get(c, 0) + 1
        for c in t:
            if c not in count:
                return False
            count[c] -= 1
            if count[c] == 0:
                del count[c]
        return True`,
    test: `resultado = Solution().isAnagram("anagram", "nagaram")
print(resultado)`,
  },
  {
    name: 'Valid Parentheses (stack)',
    code: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        pares = {')': '(', ']': '[', '}': '{'}
        for c in s:
            if c in pares:
                if not stack or stack.pop() != pares[c]:
                    return False
            else:
                stack.append(c)
        return not stack`,
    test: `resultado = Solution().isValid("([{}])")
print(resultado)`,
  },
  {
    name: 'Rotate Image (matriz)',
    code: `class Solution:
    def rotate(self, matrix: List[List[int]]) -> None:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for fila in matrix:
            fila.reverse()`,
    test: `matrix = [[1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]]
Solution().rotate(matrix)`,
  },
  {
    name: 'Reverse Linked List',
    code: `class Solution:
    def reverseList(self, head):
        prev = None
        curr = head
        while curr:
            siguiente = curr.next
            curr.next = prev
            prev = curr
            curr = siguiente
        return prev`,
    test: `head = build_list([1, 2, 3, 4, 5])
resultado = Solution().reverseList(head)`,
  },
  {
    name: 'Max Depth Tree (recursión)',
    code: `class Solution:
    def maxDepth(self, root) -> int:
        if not root:
            return 0
        izq = self.maxDepth(root.left)
        der = self.maxDepth(root.right)
        return 1 + max(izq, der)`,
    test: `root = build_tree([3, 9, 20, None, None, 15, 7])
resultado = Solution().maxDepth(root)
print("profundidad:", resultado)`,
  },
];
