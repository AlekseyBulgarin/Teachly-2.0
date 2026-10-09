import { demoLearningTasks, demoLearningTracks, demoLearningVariants, demoTheoryFixtures } from './demo-learning-fixtures';

describe('showcase learning fixtures', () => {
  it('provides twelve bilingual tasks with stable option ids', () => {
    expect(demoLearningTasks).toHaveLength(12);
    expect(new Set(demoLearningTasks.map((task) => task.taskId)).size).toBe(12);
    expect(new Set(demoLearningTasks.map((task) => task.versionId)).size).toBe(12);
    for (const task of demoLearningTasks) {
      expect(task.ru.options.map((option) => option.id)).toEqual(task.en.options.map((option) => option.id));
      expect(task.ru.options.some((option) => option.id === task.correctOptionId)).toBe(true);
    }
  });

  it('builds three five-task tracks and variants only from known tasks', () => {
    const known = new Set(demoLearningTasks.map((task) => task.taskId));
    expect(demoLearningTracks).toHaveLength(3);
    expect(demoLearningVariants).toHaveLength(3);
    for (const track of demoLearningTracks) {
      expect(track.taskIds).toHaveLength(5);
      expect(new Set(track.taskIds).size).toBe(5);
      expect(track.taskIds.every((taskId) => known.has(taskId))).toBe(true);
    }
  });

  it('links every theory fixture to a known task', () => {
    const known = new Set(demoLearningTasks.map((task) => task.taskId));
    expect(demoTheoryFixtures).toHaveLength(4);
    expect(demoTheoryFixtures.every((theory) => known.has(theory.taskId))).toBe(true);
  });
});
