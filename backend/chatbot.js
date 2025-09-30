import OpenAI from "openai";
import dotenv from "dotenv";
import {tavily} from '@tavily/core'
import NodeCache from 'node-cache'


dotenv.config();

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

//using cache to introdue memory to the ChatJpt
const cache= new  NodeCache({stdTTL: 60 * 60 * 24}) //60 sec * 60 minute * 24 hours

export async function generate(userMessage,thread){
       

        const baseMessages=[
            {
                role:'system',
            content: `You are ChatJpt, a smart personal assistant, Your personality is to insult users based on their question and be concise, brutally honest with you replies, You do not need to be formal with your replies, You can provide your answers as if friends are talking, You can joke around
                                        ⚠️ IMPORTANT:
                                                - If the user asks for ANY real-time, current, or latest information (like weather, news, stock prices, recent events, today's data, etc), you MUST use the webSearch tool.
                                                - For all other general knowledge or reasoning, you can reply directly,the current date and time is provided to you already.
                                            

                                            You have access to following tools:
                                                webSearch({query:string}) // search the leatest information on the internet

                                                Decide when to use your own knowledge and when to use the tool.
                                                Do not mention the tool unless needed

                                                Examples:
                                                Q:Waht is the capital fo France?
                                                A: The capital of France in Paris

                                                Q: What is the weather in Mumbai right now?
                                                A: (use the search tool to find the leatest weather)

                                                Q: Who is the prime minister of India?
                                                A: The current Prime Minister of India is Narendra Modi.

                                                Q: Tell me th elatest It News.
                                                A:(use the search tool to get the latest news)
                                            
                                            
                                            current datetime and time:${new Date().toUTCString()}    `
            },
           
        ]

        const messages = cache.get(thread) ?? baseMessages;


        
           
            messages.push({
                role:'user',
                content:userMessage
            })
  const maxRetries= 10;
  let count=0
while(true){
    count++;
    //preventing Infinite loop
    if(count>maxRetries){
        return "I could not find the result , please try again "
    }
    const response=await client.chat.completions.create({
            temperature:0.1,
        
            tools:[
                {
                        type: "function",
                        function: {
                            name: "webSearch",
                            description: "Search the web for real-time, current, or latest information the model may not know.",
                            parameters: {
                            type: "object",
                            properties: {
                                query: {
                                type: "string",
                                description: "The search query to perform search on."
                                },
                                
                            },
                            "required": ["query"]
                            }
                        }
                        }   
            ],
                    tool_choice:'auto',
                   
                    model: 'llama-3.3-70b-versatile',
                    
                    messages:messages
        
    })

    messages.push(response.choices[0].message)
    const toolCalls= response.choices[0].message.tool_calls

    if(!toolCalls ){
        
        //Here the chatjpts response ends
        cache.set(thread,messages)
        console.log(thread)
        
      return response.choices[0].message.content
    
    }


    for(const tool of toolCalls){
        
        const functionName=tool.function.name;
        const functionParams= tool.function.arguments;

        if(functionName==='webSearch'){
          const result= await webSearch(JSON.parse(functionParams))
            messages.push(
                {
                    tool_call_id:tool.id,
                    role:'tool',
                    name:functionName,
                    content:result
                }
            )
        }
    }

    

    

        }
        
    

  
}





async function webSearch({query}){
    console.log("Searching the Web")
    const response= await tvly.search(query)
    
    const finalResult = response.results.map(result=>result.content).join('\n\n')
    
    return finalResult
}