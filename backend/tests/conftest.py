import sys
from pathlib import Path

# Garantir que o diretório do backend esteja no sys.path para que 'app' seja importável
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
