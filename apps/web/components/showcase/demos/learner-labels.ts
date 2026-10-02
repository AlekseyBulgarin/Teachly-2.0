import type { LearnerCurriculum } from "@/lib/api";

export function curriculumLine(curriculum: LearnerCurriculum): string {
  return [curriculum.subject.name, curriculum.course.name, curriculum.topic.name, curriculum.skill.name]
    .filter(Boolean)
    .join(" / ");
}

export function formatShare(rate: number | null): string {
  return rate === null ? "—" : `${Math.round(rate * 100)}%`;
}

export function formatDay(iso: string): string {
  return iso.slice(0, 10);
}

export function formatMoment(iso: string | null): string {
  if (!iso) return "—";
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}
