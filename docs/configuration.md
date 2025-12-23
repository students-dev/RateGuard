# Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `windowMs` | `number` | **Required** | Time frame for the rate limit in milliseconds. |
| `max` | `number` | **Required** | Maximum number of requests allowed per window. |
| `algorithm` | `"fixed" \| "sliding"` | `"fixed"` | The rate limiting algorithm to use. 'sliding' provides smoother traffic control. |
| `message` | `string` | `"Too many requests..."` | Response message when limit is exceeded. |
| `statusCode` | `number` | `429` | HTTP status code when limit is exceeded. |
| `keyGenerator` | `(req: any) => string` | `req.ip` | Function to generate a unique key for the request (e.g. IP, user ID). |
| `store` | `Store` | `MemoryStore` | Custom storage backend. |

## Algorithms

### Fixed Window (Default)
Counts requests in fixed time windows (e.g. 10:00-10:01, 10:01-10:02). Simple and memory efficient, but allows bursts at window boundaries.

### Sliding Window
Uses a log of timestamps to ensure accurate rate limiting across rolling windows. Prevents boundary bursts but consumes slightly more memory per user.
