import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="relative z-10 flex justify-center items-center text-center h-[calc(100dvh-120px)] mt-4 px-4 bg-core-background">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-recoleta font-bold">
          Meet core, the better workflow
        </h1>
        <span className="text-lg text-muted-foreground">
          capture • organize • review • engage
        </span>
      </div>
    </div>
  )
}
