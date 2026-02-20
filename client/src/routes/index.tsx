import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, NoteIcon, StarIcon } from '@hugeicons/core-free-icons'
import { Check, Pause, Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavStore } from '@/lib/store'
import { Feature1, Feature2, Humation, SlothLogo } from '@/constants/assets'
import { Checkbox } from '@/components/ui/checkbox'

export const Route = createFileRoute('/')({
  component: App,
})

const TYPING_TEXT = 'Buy groceries'
const DEMO_DURATION_MS = 6000

function AddTodoDemo() {
  const [phase, setPhase] = useState<'idle' | 'input' | 'typing' | 'done'>(
    'idle',
  )
  const [typedLength, setTypedLength] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('input'), 800)
    const t2 = setTimeout(() => setPhase('typing'), 1400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'typing') return
    if (typedLength >= TYPING_TEXT.length) {
      const t = setTimeout(() => setPhase('done'), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(
      () => setTypedLength((n) => n + 1),
      80 + Math.random() * 40,
    )
    return () => clearTimeout(t)
  }, [phase, typedLength])

  useEffect(() => {
    const loop = setInterval(() => {
      setPhase('idle')
      setTypedLength(0)
      setTimeout(() => setPhase('input'), 400)
      setTimeout(() => setPhase('typing'), 1000)
    }, DEMO_DURATION_MS)
    return () => clearInterval(loop)
  }, [])

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-80 p-3 rounded-lg bg-sloth-background/80 backdrop-blur-sm shadow-lg">
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 w-full py-2 px-3 rounded-md bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-muted-foreground text-sm font-medium transition-colors"
            >
              <Plus className="size-4" />
              Add new todo
            </motion.button>
          )}
          {(phase === 'input' || phase === 'typing' || phase === 'done') && (
            <motion.div
              key="input-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-white/5 border border-white/10">
                <Checkbox
                  checked={phase === 'done'}
                  onCheckedChange={() => {}}
                  className="size-3.5 rounded-[3px] border-white/30 data-[state=checked]:bg-[#18AEF8] data-[state=checked]:border-0 shrink-0 pointer-events-none"
                />
                <span className="text-sm text-foreground truncate flex-1 min-w-0">
                  {TYPING_TEXT.slice(0, typedLength)}
                  {phase === 'typing' && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-px h-4 bg-foreground ml-0.5 align-middle"
                    />
                  )}
                </span>
              </div>
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  ✓ Added to your list
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

const BIG_TASK = 'Plan product launch'
const STEPS = ['Set goals', 'Outline tasks', 'Schedule timeline']
const PARTNER_DEMO_DURATION_MS = 7000

function ThinkingPartnerDemo() {
  const [phase, setPhase] = useState<'big-task' | 'pause' | 'steps' | 'done'>(
    'big-task',
  )
  const [visibleSteps, setVisibleSteps] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('pause'), 1600)
    const t2 = setTimeout(() => setPhase('steps'), 2800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'steps') return
    if (visibleSteps >= STEPS.length) return
    const t = setTimeout(() => setVisibleSteps((n) => n + 1), 450)
    return () => clearTimeout(t)
  }, [phase, visibleSteps])

  useEffect(() => {
    if (phase !== 'steps' || visibleSteps < STEPS.length) return
    const t = setTimeout(() => setPhase('done'), 700)
    return () => clearTimeout(t)
  }, [phase, visibleSteps])

  useEffect(() => {
    const loop = setInterval(() => {
      setPhase('big-task')
      setVisibleSteps(0)
      setTimeout(() => setPhase('pause'), 1600)
      setTimeout(() => setPhase('steps'), 2800)
    }, PARTNER_DEMO_DURATION_MS)
    return () => clearInterval(loop)
  }, [])

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-4 w-80 p-3 rounded-lg bg-sloth-background/80 backdrop-blur-sm shadow-lg">
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="wait">
          {(phase === 'big-task' || phase === 'pause') && (
            <motion.div
              key="big-task"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              className="flex flex-col items-center gap-2 py-1"
            >
              <span className="text-xs text-muted-foreground">
                {phase === 'big-task' ? 'Big task' : 'Pause & reflect…'}
              </span>
              {phase === 'big-task' ? (
                <motion.div
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-sm font-medium text-foreground text-center px-3 py-2 rounded-md bg-white/5 border border-white/10 w-full"
                >
                  {BIG_TASK}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-muted-foreground py-2"
                >
                  <Pause className="size-4" />
                  <span className="text-xs">Break it down</span>
                </motion.div>
              )}
            </motion.div>
          )}
          {(phase === 'steps' || phase === 'done') && (
            <motion.div
              key="steps"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2"
            >
              <span className="text-xs text-muted-foreground">
                {phase === 'done' ? 'Easy steps' : 'Break it down'}
              </span>
              {STEPS.slice(0, visibleSteps + 1).map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-white/5 border border-white/10"
                >
                  {i < visibleSteps ? (
                    <Check
                      className="size-3.5 shrink-0 text-[#18AEF8]"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <div className="size-3.5 shrink-0 rounded-full border border-white/30" />
                  )}
                  <span className="text-sm text-foreground">{step}</span>
                </motion.div>
              ))}
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground text-center pt-1"
                >
                  ✓ At your own pace
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function App() {
  const showDisplay = useNavStore((state) => state.showDisplay)

  useEffect(() => {
    showDisplay()
  }, [showDisplay])

  return (
    <div className="bg-sloth-background text-sloth-foreground">
      <div className="relative z-10 flex justify-center items-center text-center min-h-[calc(100vh-80px)] px-4 sm:px-6 pb-40 md:pb-20">
        <div className="flex flex-col items-center gap-6 sm:gap-10">
          <img src={SlothLogo} className="w-20 sm:w-24 md:w-30 rounded-2xl" />
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <h1 className="text-[1.5rem] md:text-4xl font-oktah-round font-bold leading-tight">
              Meet{' '}
              <span className="px-1 font-recoleta text-sloth-cream font-black">
                Sloth
              </span>
              <br className="md:hidden" /> Productive without pressure
            </h1>
            <span className="w-full max-w-[18rem] sm:max-w-[24rem] sm:w-120 text-muted-foreground text-sm sm:text-base">
              Plan your day at your own pace. Sloth keeps your tasks simple,
              focused, and stress free. So progress feels good again
            </span>
            <div className="flex gap-2 items-center">
              <HugeiconsIcon
                icon={StarIcon}
                size={24}
                color="#E4D7B0"
                fill="#E4D7B0"
                strokeWidth={2}
              />
              <span className="font-bold pt-1">
                So progress feels good again
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full h-fit pb-12 sm:pb-20 md:pb-40 flex flex-col items-center justify-center gap-16 md:gap-20">
        {/* First feature */}
        <div className="relative w-full px-4 sm:px-6 md:px-[10%] flex flex-col-reverse md:flex-row justify-center items-start md:items-center gap-6 md:gap-10">
          <div className="relative w-full md:w-[45%] aspect-square max-w-full md:max-w-none flex justify-start items-center bg-sloth-background-hover rounded-xl shrink-0 min-h-0 self-start">
            <AddTodoDemo />
            <img
              src={Feature1}
              className="w-50 md:w-60 absolute -bottom-16 right-4 sm:-bottom-8 sm:right-6 md:-bottom-10 md:right-10"
            />
          </div>

          <div className="w-full md:w-[40%] flex flex-col items-start md:text-left">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={NoteIcon} strokeWidth={2.5} />
              <h2 className="text-3xl font-semibold whitespace-nowrap">
                Capture tasks at speed
              </h2>
            </div>
            <span className="w-full text-muted-foreground mt-2 text-sm sm:text-base">
              Quickly jot down a new task whenever inspiration strikes no fuss,
              no friction. Sloth makes it effortless to add, view, and manage
              your to-dos, helping you stay organized without ever feeling
              overwhelmed.
            </span>
          </div>
        </div>

        {/* 2nd feature */}
        <div className="relative w-full px-4 sm:px-6 md:px-[10%] flex flex-col-reverse md:flex-row justify-center items-start md:items-center gap-6 md:gap-10">
          <div className="w-full md:w-[40%] flex flex-col items-start md:text-left order-2 md:order-1">
            <div className="flex items-center gap-1">
              <HugeiconsIcon icon={AiMagicIcon} strokeWidth={2.5} />
              <h2 className="text-3xl font-semibold whitespace-nowrap">
                Your thinking partner
              </h2>
            </div>
            <span className="w-full text-muted-foreground mt-2 text-sm sm:text-base">
              Sloth is your gentle thinking companion—helping you pause,
              reflect, and break big tasks into easy steps at your own pace.
            </span>
          </div>

          <div className="relative w-full md:w-[45%] aspect-square max-w-full md:max-w-none flex justify-center items-center bg-sloth-background-hover rounded-xl shrink-0 min-h-0 self-start order-1 md:order-2">
            <ThinkingPartnerDemo />
            <img
              src={Feature2}
              className="w-40 md:w-50 absolute bottom-0 right-4 sm:bottom-6 sm:right-6 md:bottom-6 md:right-6"
            />
          </div>
        </div>
      </section>

      <div className="w-full h-100 flex flex-col justify-end items-center">
        <div className="flex flex-col items-center justify-start">
          <span className="text-sloth-cream font-recoleta font-black">
            Sloth
          </span>
          <span className="text-muted-foreground/50">/slɒθ/</span>
          <p>
            <span className="line-through text-muted-foreground/50">Un</span>
            willingness to work or make any effort
          </p>
        </div>
        <img src={Humation} className="w-50 grayscale" />
      </div>
    </div>
  )
}
