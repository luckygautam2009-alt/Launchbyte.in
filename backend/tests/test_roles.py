import pytest
from fastapi import HTTPException

from app.dependencies.auth import require_role
from app.models.enums import UserRole
from app.models.users import User


def test_require_role_blocks_other_roles_and_allows_match():
    checker = require_role(UserRole.ADMIN)
    with pytest.raises(HTTPException) as exc:
        checker(User(role=UserRole.USER))
    assert exc.value.status_code == 403
    admin = User(role=UserRole.ADMIN)
    assert checker(admin) is admin
