# Frontend Generate Integration

## Purpose

This document defines the frontend contract for `POST /api/v1/questions/generate`.

Frontend should:

- send canonical enum values instead of Chinese UI labels
- send numeric `targetCount` and `initialBatchCount`
- set `initialBatchCount = targetCount`
- display backend error `message` instead of collapsing everything into one generic toast

## Canonical Request Contract

Endpoint:

```text
POST /api/v1/questions/generate
```

Required request body:

```json
{
  "material": "string",
  "mode": "modeA",
  "feedbackMode": "instant",
  "type": "single",
  "difficulty": "medium",
  "targetCount": 3,
  "initialBatchCount": 3
}
```

Notes:

- `targetCount` must be an integer from `1` to `100`
- `initialBatchCount` must equal `targetCount`
- `feedbackMode` standard values are `instant` and `after_all`
- backend now tolerates aliases such as `immediate`, but frontend should still send canonical values

## UI To API Mapping

| UI label | Frontend state | Backend field | Backend value |
|---|---|---|---|
| 原文提取 | `source` | `mode` | `modeA` |
| 知识拓展 | `extend` | `mode` | `modeB` |
| 即时反馈 | `instant` | `feedbackMode` | `instant` |
| 全做再看 | `after_all` | `feedbackMode` | `after_all` |
| 单选题 | `single` | `type` | `single` |
| 多选题 | `multi` | `type` | `multi` |
| 简单 | `easy` | `difficulty` | `easy` |
| 中等 | `medium` | `difficulty` | `medium` |
| 困难 | `hard` | `difficulty` | `hard` |
| 5题/10题/15题/自定义 | number | `targetCount` | integer |
| 同上 | number | `initialBatchCount` | same as `targetCount` |

## Recommended Frontend Mapping Code

```ts
const MODE_MAP = {
  source: "modeA",
  extend: "modeB",
} as const;

const FEEDBACK_MODE_MAP = {
  instant: "instant",
  after_all: "after_all",
} as const;

const TYPE_MAP = {
  single: "single",
  multi: "multi",
} as const;

const DIFFICULTY_MAP = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
} as const;

function buildGeneratePayload(form: {
  material: string;
  mode: keyof typeof MODE_MAP;
  feedbackMode: keyof typeof FEEDBACK_MODE_MAP;
  type: keyof typeof TYPE_MAP;
  difficulty: keyof typeof DIFFICULTY_MAP;
  presetCount?: number;
  customCount?: string | number;
  useCustomCount?: boolean;
}) {
  const targetCount = form.useCustomCount
    ? Number(form.customCount)
    : Number(form.presetCount);

  return {
    material: form.material.trim(),
    mode: MODE_MAP[form.mode],
    feedbackMode: FEEDBACK_MODE_MAP[form.feedbackMode],
    type: TYPE_MAP[form.type],
    difficulty: DIFFICULTY_MAP[form.difficulty],
    targetCount,
    initialBatchCount: targetCount,
  };
}
```

## Error Handling

### Current frontend problem

Frontend should not collapse every failure into:

```text
本次没有可用题目，请调整材料后重试
```

That message hides the real backend cause and makes debugging much harder.

### Required behavior

- if backend returns `message`, show that message first
- if backend does not return `message`, show a generic fallback
- in development, always log `status`, `code`, `message`, and submitted `payload`

Recommended implementation:

```ts
function resolveErrorMessage(error: any) {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    "生成失败，请稍后重试"
  );
}

async function submitGenerate(payload: any) {
  try {
    const res = await api.post("/api/v1/questions/generate", payload);
    const body = res.data;

    if (body?.code !== 0) {
      throw { response: { data: body } };
    }

    return body.data;
  } catch (error) {
    const message = resolveErrorMessage(error);

    console.error("generate failed", {
      payload,
      status: error?.response?.status,
      code: error?.response?.data?.code,
      message: error?.response?.data?.message,
      raw: error,
    });

    showToast(message);
    throw error;
  }
}
```

## Frontend Validation Before Submit

Frontend should reject the request before calling the API if any of the following is true:

- `material` is empty
- custom count is not an integer
- custom count is less than `1` or greater than `100`
- `initialBatchCount !== targetCount`

Recommended validation:

```ts
function validateGeneratePayload(payload: {
  material: string;
  targetCount: number;
  initialBatchCount: number;
}) {
  if (!payload.material.trim()) {
    return "材料不能为空";
  }

  if (!Number.isInteger(payload.targetCount) || payload.targetCount < 1 || payload.targetCount > 100) {
    return "题量必须是 1 到 100 的整数";
  }

  if (payload.initialBatchCount !== payload.targetCount) {
    return "initialBatchCount 必须等于 targetCount";
  }

  return "";
}
```

## Development Logging

In development mode, log the final request payload before sending:

```ts
console.log("generate payload", payload);
```

This is important because the UI label may look correct while the actual submitted enum value is wrong.

Typical hidden issues already observed:

- `feedbackMode` sent as `immediate` instead of `instant`
- `targetCount` sent as string `"3"` instead of number `3`
- UI selected custom count but request still used previous preset count

## Expected Success Shape

When frontend requests `targetCount = n` and `initialBatchCount = n`, backend should return a completed one-shot result:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "savedCount": 3,
    "session": {
      "questions": [{}, {}, {}]
    },
    "generationJob": {
      "targetCount": 3,
      "loadedCount": 3,
      "status": "completed"
    }
  }
}
```

Frontend should treat the generation as successful only when:

- `code === 0`
- `data.savedCount === targetCount`
- `data.session.questions.length === targetCount`
- `data.generationJob.targetCount === targetCount`
- `data.generationJob.loadedCount === targetCount`
- `data.generationJob.status === "completed"`

## Minimal Acceptance Checklist

Frontend can self-check against this list:

1. Selecting `原文提取 + 即时反馈 + 单选题 + 中等 + 自定义 3` sends:

```json
{
  "mode": "modeA",
  "feedbackMode": "instant",
  "type": "single",
  "difficulty": "medium",
  "targetCount": 3,
  "initialBatchCount": 3
}
```

2. If backend returns `400/500`, frontend shows backend `message` instead of a fixed generic sentence.

3. If backend returns success, frontend reads question list from:

```text
data.session.questions
```

4. Frontend does not assume batch generation for this API. This endpoint is one-shot only.
