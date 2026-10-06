import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import "./App.css"


function App() {

  const [output, setOutput] = useState("")
  const [runError, setRunError] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [lessons, setLessons] = useState([])
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)

  const [code, setCode] = useState("")
  const [result, setResult] = useState(null)

  const [backendConnected, setBackendConnected] = useState(false)


  useEffect(() => {

    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then(() => {
        setBackendConnected(true)
      })
      .catch(() => {
        setBackendConnected(false)
      })


    fetch("http://127.0.0.1:8000/lessons")
      .then((response) => response.json())
      .then((data) => {
        setLessons(data)
      })
      .catch((error) => {
        console.error("Dersler alınamadı:", error)
      })

  }, [])


  function openLesson(lessonId) {

    fetch(`http://127.0.0.1:8000/lessons/${lessonId}`)
      .then((response) => response.json())
      .then((data) => {
        setSelectedLesson(data)
        setSelectedTopic(null)
        setResult(null)
      })

  }


  function openTopic(topicId) {

    fetch(
      `http://127.0.0.1:8000/lessons/1/topics/${topicId}`
    )
      .then((response) => response.json())
      .then((data) => {

        setSelectedTopic(data)
        setCode("")
        setResult(null)

      })

  }


  function checkAnswer() {

    fetch("http://127.0.0.1:8000/check-answer", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        code: code
      })

    })
      .then((response) => response.json())
      .then((data) => {
        setResult(data)
      })

  }
  function runCode() {

  setIsRunning(true)
  setOutput("")
  setRunError("")

  fetch("http://127.0.0.1:8000/run-code", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      code: code,
      stdin: ""
    })

  })
    .then((response) => response.json())
    .then((data) => {

      setOutput(data.stdout)
      setRunError(data.stderr)
      setIsRunning(false)

    })
    .catch((error) => {

      setRunError(
        "Kod çalıştırılırken bağlantı hatası oluştu."
      )

      console.error(error)

      setIsRunning(false)

    })

}

  return (

    <div className="app">

      {/* HEADER */}

      <header className="header">

        <div>
          <h1>Python Learning System</h1>
          <span>Python öğrenme platformu</span>
        </div>


        <div
          className={
            backendConnected
              ? "backend-status connected"
              : "backend-status disconnected"
          }
        >

          <span className="status-dot"></span>

          {backendConnected
            ? "Backend Bağlı"
            : "Backend Kapalı"}

        </div>

      </header>



      <div className="layout">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <h2>Dersler</h2>


          {lessons.map((lesson) => (

            <button
              key={lesson.id}
              className={
                selectedLesson?.id === lesson.id
                  ? "lesson-button active"
                  : "lesson-button"
              }
              onClick={() => openLesson(lesson.id)}
            >

              <span>
                {String(lesson.id).padStart(2, "0")}
              </span>

              {lesson.title}

            </button>

          ))}

        </aside>



        {/* ANA İÇERİK */}

        <main className="content">


          {/* HİÇ DERS SEÇİLMEDİ */}

          {!selectedLesson && (

            <div className="welcome">

              <h2>Python öğrenmeye hazır mısın?</h2>

              <p>
                Sol taraftaki derslerden birini seçerek başla.
              </p>

            </div>

          )}



          {/* DERS SEÇİLDİ AMA KONU SEÇİLMEDİ */}

          {selectedLesson && !selectedTopic && (

            <div>

              <div className="page-title">

                <span>
                  Ders {selectedLesson.id}
                </span>

                <h2>
                  {selectedLesson.title}
                </h2>

              </div>


              <div className="topics-grid">

                {selectedLesson.topics.map((topic) => (

                  <div
                    className="topic-card"
                    key={topic.id}
                  >

                    <div className="topic-number">
                      {topic.id}
                    </div>


                    <div>

                      <h3>
                        {topic.title}
                      </h3>

                      <p>
                        {topic.completed
                          ? "✅ Tamamlandı"
                          : "⏳ Başlanmadı"}
                      </p>

                    </div>


                    <button
                      onClick={() => openTopic(topic.id)}
                    >
                      Konuya Başla
                    </button>

                  </div>

                ))}

              </div>

            </div>

          )}



          {/* KONU EKRANI */}

          {selectedTopic && (

            <div className="topic-page">

              <button
                className="back-button"
                onClick={() => {
                  setSelectedTopic(null)
                  setResult(null)
                }}
              >
                ← Konulara Dön
              </button>


              <div className="page-title">

                <span>
                  {selectedTopic.lesson_title}
                </span>

                <h2>
                  {selectedTopic.title}
                </h2>

              </div>



              <section className="lesson-box">

                <h3>Konu Anlatımı</h3>

                <p>
                  {selectedTopic.description}
                </p>

              </section>



              <section className="example-box">

                <h3>Örnek</h3>

                <pre>
                  <code>
                    {selectedTopic.example}
                  </code>
                </pre>

              </section>



              <section className="question-box">

                <h3>Soru</h3>

                <p>
                  {selectedTopic.question}
                </p>

              </section>



              <section className="editor-section">

                <div className="editor-header">

                  <span>Python</span>

                  <span>main.py</span>

                </div>


                <Editor
                  height="320px"
                  language="python"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => {
                    setCode(value ?? "")
                  }}
                  options={{
                    fontSize: 15,
                    minimap: {
                      enabled: false
                    },
                    automaticLayout: true,
                    tabSize: 4,
                    insertSpaces: true,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    bracketPairColorization: {
                      enabled: true
                    }
                  }}
                />


              </section>



              <div className="action-buttons">

              <button
                className="run-button"
                onClick={runCode}
                disabled={isRunning}
              >
                {isRunning
                  ? "Çalışıyor..."
                  : "▶ Çalıştır"}
              </button>

              <button
                className="check-button"
                onClick={checkAnswer}
              >
                ✓ Kontrol Et
              </button>

            </div>
            {(output || runError) && (

            <div className="terminal">

              <div className="terminal-title">
                OUTPUT
              </div>

              {output && (
                <pre className="terminal-output">
                  {output}
                </pre>
              )}

              {runError && (
                <pre className="terminal-error">
                  {runError}
                </pre>
              )}

            </div>

          )}


              {result && (

                <div
                  className={
                    result.passed
                      ? "result-box success"
                      : "result-box error"
                  }
                >

                  <h2>

                    {result.passed
                      ? "✅ Doğru!"
                      : "❌ Henüz doğru değil"}

                  </h2>


                  <div className="checks">

                    {result.checks.map(
                      (check, index) => (

                        <div
                          key={index}
                          className={
                            check.passed
                              ? "check success-check"
                              : "check error-check"
                          }
                        >

                          {check.passed
                            ? "✓"
                            : "✕"}

                          <span>
                            {check.name}
                          </span>

                        </div>

                      )
                    )}

                  </div>


                  {!result.passed && (

                    <div className="solution">

                      <h3>
                        Doğru Cevap
                      </h3>

                      <pre>
                        <code>
                          {result.solution}
                        </code>
                      </pre>

                    </div>

                  )}

                </div>

              )}

            </div>

          )}

        </main>

      </div>

    </div>

  )

}

export default App