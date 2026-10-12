import subprocess
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ast

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Python Learning System API çalışıyor"
    }


@app.get("/lessons")
def get_lessons():
    return [
        {
            "id": 1,
            "title": "Programlama Temelleri",
            "completed": False
        },
        {
            "id": 2,
            "title": "Koşullar",
            "completed": False
        },
        {
            "id": 3,
            "title": "Döngüler",
            "completed": False
        }
    ]
@app.get("/lessons/{lesson_id}")
def get_lesson(lesson_id: int):

    lessons = {
        1: {
            "id": 1,
            "title": "Programlama Temelleri",
            "topics": [
                {
                    "id": 1,
                    "title": "print()",
                    "completed": False
                },
                {
                    "id": 2,
                    "title": "Değişkenler",
                    "completed": False
                },
                {
                    "id": 3,
                    "title": "Veri Tipleri",
                    "completed": False
                },
                {
                    "id": 4,
                    "title": "input()",
                    "completed": False
                }
            ]
        },

        2: {
            "id": 2,
            "title": "Koşullar",
            "topics": [
                {
                    "id": 1,
                    "title": "if",
                    "completed": False
                },
                {
                    "id": 2,
                    "title": "elif",
                    "completed": False
                },
                {
                    "id": 3,
                    "title": "else",
                    "completed": False
                }
            ]
        },

        3: {
            "id": 3,
            "title": "Döngüler",
            "topics": [
                {
                    "id": 1,
                    "title": "for",
                    "completed": False
                },
                {
                    "id": 2,
                    "title": "while",
                    "completed": False
                }
            ]
        }
    }

    return lessons.get(lesson_id)
class CodeCheckRequest(BaseModel):
    code: str


@app.get("/lessons/1/topics/1")
def get_print_topic():
    return {
        "id": 1,
        "title": "print()",
        "lesson_title": "Programlama Temelleri",
        "description": (
            "print() fonksiyonu Python'da ekrana veri yazdırmak için kullanılır."
        ),
        "example": 'print("Merhaba Dünya")',
        "question": 'Ekrana "Merhaba Dünya" yazdıran Python kodunu yaz.',
    }


@app.post("/check-answer")
def check_answer(request: CodeCheckRequest):

    code = request.code

    try:
        tree = ast.parse(code)
        syntax_correct = True

    except SyntaxError:
        return {
            "passed": False,
            "checks": [
                {
                    "name": "Python sözdizimi doğru",
                    "passed": False
                }
            ],
            "solution": 'print("Merhaba Dünya")'
        }

    print_used = False
    correct_text = False

    for node in ast.walk(tree):

        if isinstance(node, ast.Call):

            if (
                isinstance(node.func, ast.Name)
                and node.func.id == "print"
            ):
                print_used = True

                if node.args:
                    first_argument = node.args[0]

                    if (
                        isinstance(first_argument, ast.Constant)
                        and first_argument.value == "Merhaba Dünya"
                    ):
                        correct_text = True

    checks = [
        {
            "name": "Python sözdizimi doğru",
            "passed": syntax_correct
        },
        {
            "name": "print() kullanıldı",
            "passed": print_used
        },
        {
            "name": '"Merhaba Dünya" doğru yazdırıldı',
            "passed": correct_text
        }
    ]

    all_passed = all(
        check["passed"]
        for check in checks
    )

    return {
        "passed": all_passed,
        "checks": checks,
        "solution": 'print("Merhaba Dünya")'
    }
class RunCodeRequest(BaseModel):
    code: str
    stdin: str = ""


@app.post("/run-code")
def run_code(request: RunCodeRequest):

    if len(request.code) > 10000:
        return {
            "success": False,
            "stdout": "",
            "stderr": "Kod çok uzun.",
            "exit_code": None
        }

    command = [
        "docker",
        "run",
        "--rm",
        "-i",

        # İnternete erişmesin
        "--network", "none",

        # Kaynak sınırları
        "--memory", "128m",
        "--cpus", "0.5",
        "--pids-limit", "64",

        # Yetkileri azalt
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",

        # Dosya sistemini salt okunur yap
        "--read-only",

        # Geçici alan
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",

        # Root olarak çalışmasın
        "--user", "65534:65534",

        "python:3.13-alpine",

        # İzole Python
        "python",
        "-I",
        "-B",
        "-c",
        request.code
    ]

    try:

        process = subprocess.run(
        command,
        input=request.stdin,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=5
    )

        return {
            "success": process.returncode == 0,
            "stdout": process.stdout,
            "stderr": process.stderr,
            "exit_code": process.returncode
        }

    except subprocess.TimeoutExpired:

        return {
            "success": False,
            "stdout": "",
            "stderr": "Çalışma süresi aşıldı. Kod 5 saniyeden uzun çalışamaz.",
            "exit_code": None
        }

    except Exception as error:

        return {
            "success": False,
            "stdout": "",
            "stderr": str(error),
            "exit_code": None
        }