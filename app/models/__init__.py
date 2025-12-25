from app.auth.models import User
from app.projects.models import Project
from app.images.models import Image
from app.annotations.models import Annotation
from app.datasets.models import Dataset 
import app.images.events
import app.datasets.events  # Register dataset deletion events