# User Flows

## Teacher Onboarding and Student Management

1. Teacher registers or signs in.
2. The platform creates a personal workspace context.
3. Teacher adds or invites students and optionally creates a group.
4. The API authorizes each action against the teacher's relationship or organization membership.
5. Audit records capture invitations, membership changes, and sensitive access.

## Teacher Training and Homework

1. Teacher selects a subject, topic, skill, or task set.
2. Teacher selects canonical published task versions.
3. Teacher configures a training activity or homework assignment.
4. The system stores the activity definition and recipients.
5. Students receive the activity through the application notification/read model.
6. Attempts reference the exact task versions included at assignment time.

## Assessment or Slice

1. Teacher creates a generic assessment definition.
2. Teacher selects tasks, topics, skills, difficulty, count, and rules.
3. The system snapshots the selected task versions for the assessment.
4. Student starts an assessment attempt.
5. Task attempts are evaluated using deterministic rules.
6. The system calculates results and emits learning/analytics events.
7. Teacher reviews outcomes and creates the next activity.

## Student Solving

1. Student opens an assigned or self-selected activity.
2. The API checks access and returns the published task version.
3. Student starts a task attempt.
4. Student submits an answer with an idempotency key.
5. The task engine validates and evaluates the answer.
6. The system stores the result, feedback state, and attempt history.
7. Learning logic updates progress deterministically.

## Parent Monitoring

1. A guardian is invited or requests a relationship.
2. The relationship is approved according to future consent policy.
3. Guardian access is checked against the specific child relationship.
4. Guardian sees only allowed progress, activity, and results.
5. Guardian cannot modify teacher-owned educational state by default.

## Organization Workflow

1. An organization is created or provisioned.
2. An administrator invites teachers and students.
3. Teachers create groups and conduct activities within the organization scope.
4. Organization reports aggregate authorized data.
5. Membership and access changes are audited.

## Content Import

```text
External source -> import batch -> raw content -> normalized content
-> validation -> topic/skill mapping -> moderation -> canonical version -> publish
```

Raw data is retained for traceability. Licensing and moderation status gate publication.

## Future Integration

An external product will eventually map its users and organization context to Teachly, call stable API operations, and consume results through API responses or webhooks. The initial implementation only preserves clean internal module boundaries; it does not expose a public integration contract.
