import React, { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown';

function App() {
  const [message, setMessage] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const thread = useMemo(() => (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  ), [])



  async function llmCall() {
    try {
      setError(false)
      setLoading(true)
      const response = await fetch(`http://localhost:3001/api/chat`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userInput.trim(),
          thread: thread
        })

      })
      if (!response.ok) {
        setLoading(false)
        throw new Error("Error generating the response")
      }

      const result = await response.json();
      console.log(result)
      setLoading(false)
      setMessage((prev) => [...prev, { sender: 'llm', text: result.message }])


    } catch (error) {
      setError(true)
      console.log(error)
    }
  }

  function handleAppend(e, invoke) {
    if (e.key === "Enter" && !e.shiftKey && invoke === "key") {
      e.preventDefault();
      setMessage((prev) => [...prev, { sender: 'user', text: userInput.trim() }])

      llmCall(userInput)
      setUserInput("")

    }
    if (invoke === "button") {
      setMessage((prev) => [...prev, { sender: 'user', text: userInput.trim() }])
      llmCall(userInput)
      setUserInput("")

    }


  }

  return (
    <div>
      {/* Top ChatJpt Logo? */}
      <div className='fixed top-0 bg-[#212121] h-[40px] w-full flex justify-center items-center   border-b-1 border-white/30'>
        <h1 className='py-2 font-bold text-white'>CHAT<span className='ml-[2px] bg-gradient-to-r from-purple-400 via-red-400 to-yellow-400 bg-clip-text text-transparent'>JPT</span></h1>
      </div>

      <div className='container mx-auto py-5 px-2 max-w-3xl text-white pt-[40px] pb-[200px] '>

        {/* Messages User + Assistant  */}


        {message.map((item, index) => (
          <div key={index} className={`${item.sender === 'llm' ? "mr-auto my-4  " : "ml-auto bg-[#303030] my-2  "} whitespace-pre-wrap  py-2 px-2  rounded-md  max-w-fit`}>
            {item.text}
          </div>
        ))}
        {error && (<div className='text-red-400 font-semi-bold'>Error while handeling your query</div>)}
        {loading && (<div className='animate-pulse bg-gradient-to-r from-purple-400 via-red-400 to-red-400 bg-clip-text text-transparent'>Analyzing the query...</div>)}





        {/* Input text Field */}
        <div className='fixed inset-x-0 bottom-0 pb-5 flex items-center justify-center bg-[#212121]'>
          <div className=' bg-[#303030] p-2 rounded-3xl  max-w-3xl w-full   '>

            <textarea placeholder='Ask anything  ' onKeyUp={(e) => handleAppend(e, "key")} onChange={(e) => setUserInput(e.target.value)} value={userInput} className='mr-5 w-full resize-none outline-0 p-3 ' rows="2" ></textarea>
            <div className='flex justify-end m-2 items-center'>
              <button onClick={(e) => handleAppend(e, "button")} className='bg-white text-black py-1 px-4 hover:text-black/60 font-semibold cursor-pointer rounded-md'>Ask</button>

            </div>

          </div>
        </div>
      </div>
    </div>

  )
}

export default App