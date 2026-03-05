import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (

    <div className="flex flex-col items-center gap-6 p-10 w-full min-h-screen bg-white">


      <Card className="w-full max-w-4xl p-6 bg-slate-50 shadow-md"> 
        <CardHeader>
          <CardTitle className="text-center font-bold text-3xl">How do you want to use Truework?</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col md:flex-row justify-center gap-8 pt-4">

          <Card className="w-[300px] hover:shadow-lg transition-all bg-white border-2 hover:border-blue-500 cursor-pointer">
            <CardHeader>
              <div className="flex justify-center mb-4">
    
                <Image 
                  src="/yess.jpg" 
                  alt="icon"
                  width={400} 
                  height={300} 
                  className="w-full h-auto object-cover rounded-md" 
                />
              </div>
              <CardTitle className="text-center font-bold text-xl">From idea to execution</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600"> 
              Hire trusted professionals with clarity, from that brief to final delivery.
            </CardContent>
          </Card>

          <Card className="w-[300px] hover:shadow-lg transition-all bg-white border-2 hover:border-blue-500 cursor-pointer">
            <CardHeader>
               <div className="flex justify-center mb-4">
  
                <Image 
                  src="/yes.jpg" 
                  alt="icon"
                  width={400} 
                  height={300}
                  className="w-full h-auto object-cover rounded-md" 
                />                     
              </div>
              <CardTitle className="text-center font-bold text-xl">Do work that matters</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-gray-600">
              Get discovered for your skills and grow with real projects.
            </CardContent>
          </Card>

        </CardContent>

        <div className="flex">
          <Button>
            Continue
          </Button>
        </div>

      </Card>

    </div>
  )
}