const problem = (id, title, difficulty, band, topic) => ({
  id,
  title,
  difficulty,
  band,
  topic,
  url: `https://atcoder.jp/contests/${id.split('_')[0]}/tasks/${id}`
})

export const CP_CONTESTS = [
  {
    slug: 'w1d1-a',
    day: 'Day 1',
    session: 'A',
    title: 'Week 1 · Day 1 A',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc319_d', 'Minimum Width', 631, 'brown', 'Binary Search'),
      problem('abc341_d', 'Only one of two', 829, 'green', 'Binary Search + Counting'),
      problem('abc260_d', 'Draw Your Cards', 1074, 'green', 'Ordered Set / Simulation')
    ]
  },
  {
    slug: 'w1d1-b',
    day: 'Day 1',
    session: 'B',
    title: 'Week 1 · Day 1 B',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc350_d', 'New Friends', 773, 'brown', 'DSU / Connected Components'),
      problem('abc305_e', 'Art Gallery on Graph', 1158, 'green', 'Multi-source Search'),
      problem('abc185_f', 'Range Xor Query', 1053, 'green', 'Fenwick Tree / Segment Tree')
    ]
  },
  {
    slug: 'w1d2-a',
    day: 'Day 2',
    session: 'A',
    title: 'Week 1 · Day 2 A',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc376_d', 'Cycle', 743, 'brown', 'BFS'),
      problem('abc349_d', 'Divide Interval', 832, 'green', 'Greedy / Divide-and-Conquer Observation'),
      problem('abc277_e', 'Crystal Switches', 1183, 'green', 'State Graph / 0-1 BFS')
    ]
  },
  {
    slug: 'w1d2-b',
    day: 'Day 2',
    session: 'B',
    title: 'Week 1 · Day 2 B',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc333_c', 'Repunit Trio', 624, 'brown', 'Enumeration / Observation'),
      problem('abc346_d', 'Gomamayo Sequence', 845, 'green', 'DP / Prefix-Suffix'),
      problem('abc339_e', 'Smooth Subsequence', 1109, 'green', 'DP + Segment Tree')
    ]
  },
  {
    slug: 'w1d3-a',
    day: 'Day 3',
    session: 'A',
    title: 'Week 1 · Day 3 A',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc325_c', 'Sensors', 676, 'brown', 'Grid / Connected Components'),
      problem('abc241_d', 'Sequence Query', 1177, 'green', 'Ordered Multiset'),
      problem('abc274_d', 'Robot Arms 2', 1198, 'green', 'DP / Reachability')
    ]
  },
  {
    slug: 'w1d3-b',
    day: 'Day 3',
    session: 'B',
    title: 'Week 1 · Day 3 B',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc343_c', '343', 715, 'brown', 'Enumeration / Palindrome'),
      problem('abc320_c', 'Slot Strategy 2 (Easy)', 880, 'green', 'Brute Force / Simulation'),
      problem('abc324_d', 'Square Permutation', 1090, 'green', 'Enumeration / Counting')
    ]
  },
  {
    slug: 'w1d4-a',
    day: 'Day 4',
    session: 'A',
    title: 'Week 1 · Day 4 A',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc355_c', 'Bingo 2', 568, 'brown', 'Simulation'),
      problem('abc328_d', 'Take ABC', 828, 'green', 'Stack / String'),
      problem('abc330_d', 'Counting Ls', 959, 'green', 'Counting / Contribution')
    ]
  },
  {
    slug: 'w1d4-b',
    day: 'Day 4',
    session: 'B',
    title: 'Week 1 · Day 4 B',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc374_c', 'Separated Lunch', 696, 'brown', 'Bitmask Enumeration'),
      problem('abc334_d', 'Reindeer and Sleigh', 1030, 'green', 'Prefix Sum + Binary Search'),
      problem('abc337_d', 'Cheating Gomoku Narabe', 928, 'green', 'Sliding Window / Prefix')
    ]
  },
  {
    slug: 'w1d5-a',
    day: 'Day 5',
    session: 'A',
    title: 'Week 1 · Day 5 A',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc330_c', 'Minimize Abs 2', 773, 'brown', 'Two Pointers / Search'),
      problem('abc340_d', 'Super Takahashi Bros.', 921, 'green', 'Shortest Path'),
      problem('abc351_d', 'Grid and Magnet', 1120, 'green', 'Grid Graph / Components')
    ]
  },
  {
    slug: 'w1d5-b',
    day: 'Day 5',
    session: 'B',
    title: 'Week 1 · Day 5 B',
    durationMinutes: 50,
    kind: 'mini',
    problems: [
      problem('abc358_d', 'Souvenirs', 711, 'brown', 'Greedy / Sorting'),
      problem('abc353_d', 'Another Sigma Problem', 1120, 'green', 'Contribution / Modular Arithmetic'),
      problem('abc362_d', 'Shortest Path 2', 1110, 'green', 'Dijkstra')
    ]
  },
  {
    slug: 'w1-weekend',
    day: 'Weekend',
    session: 'BIG',
    title: 'Week 1 · Weekend Big Mashup',
    durationMinutes: 150,
    kind: 'big',
    problems: [
      problem('abc344_c', 'A+B+C', 690, 'brown', 'Set / Enumeration'),
      problem('abc365_d', 'AtCoder Janken 3', 930, 'green', 'DP'),
      problem('abc351_f', 'Double Sum', 1253, 'cyan', 'BIT + Contribution'),
      problem('abc220_f', 'Distance Sums 2', 1304, 'cyan', 'Tree DP / Rerooting'),
      problem('abc214_d', 'Sum of Maximum Weights', 1341, 'cyan', 'DSU + Contribution')
    ]
  }
]

export const getCpContest = slug =>
  CP_CONTESTS.find(contest => contest.slug === slug)

export const CP_STORAGE_PREFIX = 'benjamin-cp-contest:'
