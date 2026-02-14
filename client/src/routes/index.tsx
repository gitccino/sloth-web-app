import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useNavStore } from '@/lib/store'
import { Feature1, Feature2, SlothLogo } from '@/assets'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const toggleDisplay = useNavStore((state) => state.toggleDisplay)
  const showDisplay = useNavStore((state) => state.showDisplay)

  useEffect(() => {
    showDisplay()
  }, [showDisplay])
  return (
    <>
      <div className="relative z-10 flex justify-center items-center text-center h-[calc(100dvh-80px)] px-4 pb-20 bg-sloth-background text-sloth-foreground">
        <div className="flex flex-col items-center gap-10">
          <img src={SlothLogo} className="w-30 rounded-2xl" />
          <div className="flex flex-col items-center gap-4">
            <h1
              className="text-4xl font-recoleta font-bold"
              onClick={toggleDisplay}
            >
              Meet <span className="px-2">Sloth,</span> Productive without
              pressure
            </h1>
            <span className="w-120 text-muted-foreground">
              Plan your day at your own pace. Sloth keeps your tasks simple,
              focused, and stress-free—so progress feels good again
            </span>
          </div>
        </div>
      </div>
      <section className="w-full h-fit pb-40 flex flex-col items-center justify-center gap-10">
        <div className="relative w-full px-[10%] flex justify-center items-center gap-10">
          <div className="relative w-1/3 aspect-square flex justify-start items-center bg-sloth-background-hover rounded-xl">
            <img src={Feature1} className="w-60 absolute -bottom-10 right-10" />
          </div>

          <div className="w-[40%] flex flex-col items-start">
            <h2 className="w-80 text-3xl font-bold">
              Capture tasks at the speed of sloth.
            </h2>
            <span className="w-full text-muted-foreground mt-2">
              Quickly jot down a new task whenever inspiration strikes—no fuss,
              no friction. Sloth makes it effortless to add, view, and manage
              your to-dos, helping you stay organized without ever feeling
              overwhelmed.
            </span>
          </div>
        </div>

        <div className="relative w-full px-[10%] flex justify-center items-center gap-10">
          <div className="w-[40%] flex flex-col items-start">
            <h2 className="w-80 text-3xl font-bold">Your thinking partner</h2>
            <span className="w-full text-muted-foreground mt-2">
              Sloth is your gentle thinking companion—helping you pause,
              reflect, and break big tasks into easy steps at your own pace.
            </span>
          </div>

          <div className="relative w-1/3 aspect-square flex justify-center items-center bg-sloth-background-hover rounded-xl">
            <img src={Feature2} className="w-50 absolute bottom-6 right-6" />
          </div>
        </div>
      </section>
    </>
  )
}
