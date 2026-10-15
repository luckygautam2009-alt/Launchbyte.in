# models/

SQLAlchemy ORM models, one module per domain. Full guide with ER diagram:
[`docs/database.md`](../../docs/database.md).

| Module | Tables |
|---|---|
| `users.py` | `users` |
| `profiles.py` | `user_profiles` |
| `organizations.py` | `organizations` |
| `opportunities.py` | `opportunities`, `tags`, `opportunity_tags`, `saved_opportunities` |
| `applications.py` | `applications`, `application_events` |
| `verification.py` | `verification_requests`, `verification_checks`, `opportunity_reports` |
| `notifications.py` | `notifications` |
| `audit.py` | `audit_logs` |
| `enums.py` | all domain enums (stored as VARCHAR + CHECK) |
| `types.py` | shared column types and mixins (`JSONType`, `TimestampMixin`, ...) |

**Adding a model:** create the module, import it in `models/__init__.py` (that single import is what
Alembic and the tests use to discover it), then `alembic revision --autogenerate`.
