import { CodingProblem } from '@interviewiq/shared';

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'prob-two-sum',
    title: 'Two Sum with Optimal Lookup',
    slug: 'two-sum-optimal-lookup',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    difficulty: 'EASY',
    category: 'Arrays & Hashing',
    timeLimitMs: 2000,
    memoryLimitMb: 128,
    starterCode: {
      javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      python: `def two_sum(nums, target):
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            return [lookup[diff], i]
        lookup[num] = i
    return []`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      cpp: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
      go: `package main

func twoSum(nums []int, target int) []int {
    m := make(map[int]int)
    for i, num := range nums {
        diff := target - num
        if idx, ok := m[diff]; ok {
            return []int{idx, i}
        }
        m[num] = i
    }
    return []int{}
}`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        isPublic: true,
        explanation: 'nums[0] + nums[1] == 9',
      },
      {
        id: 'tc-2',
        input: 'nums = [3,2,4], target = 6',
        expectedOutput: '[1,2]',
        isPublic: true,
        explanation: 'nums[1] + nums[2] == 6',
      },
      {
        id: 'tc-3',
        input: 'nums = [3,3], target = 6',
        expectedOutput: '[0,1]',
        isPublic: false,
      },
      {
        id: 'tc-4',
        input: 'nums = [1,5,8,12,19,25], target = 27',
        expectedOutput: '[2,4]',
        isPublic: false,
      },
    ],
  },
  {
    id: 'prob-lru-cache',
    title: 'Design Least Recently Used (LRU) Cache',
    slug: 'design-lru-cache',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.`,
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.',
    ],
    difficulty: 'HARD',
    category: 'System Data Structures',
    timeLimitMs: 2000,
    memoryLimitMb: 128,
    starterCode: {
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}`,
      typescript: `class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;
  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  put(key: number, value: number): void {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}`,
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            oldest = next(iter(self.cache))
            del self.cache[oldest]`,
      java: `// Java implementation`,
      cpp: `// C++ implementation`,
      go: `// Go implementation`,
    },
    testCases: [
      {
        id: 'tc-lru-1',
        input: 'capacity = 2, put(1, 1), put(2, 2), get(1), put(3, 3), get(2)',
        expectedOutput: '[null, null, null, 1, null, -1]',
        isPublic: true,
      },
      {
        id: 'tc-lru-2',
        input: 'capacity = 1, put(2, 1), get(2), put(3, 2), get(2), get(3)',
        expectedOutput: '[null, null, 1, null, -1, 2]',
        isPublic: false,
      },
    ],
  },
];
