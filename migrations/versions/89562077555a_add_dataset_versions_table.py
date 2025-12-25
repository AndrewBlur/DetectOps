"""add_dataset_versions_table

Revision ID: 89562077555a
Revises: b324b1638599
Create Date: 2025-12-25 12:57:28.778478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '89562077555a'
down_revision: Union[str, Sequence[str], None] = 'b324b1638599'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
