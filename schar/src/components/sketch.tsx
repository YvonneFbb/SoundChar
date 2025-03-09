import React, { useRef, useState, useEffect } from 'react'
import p5Types from 'p5'
import dynamic from 'next/dynamic'

const Sketch = dynamic(
  () =>
    import('react-p5').then(mod => {
      require('p5/lib/addons/p5.sound')
      return mod.default
    }),
  { ssr: false }
)

const CharType = {
  BLOCK_W: 0,
  BLOCK_H: 1,
  BEZIER: 2
}

class Sampler {
  mic: p5.AudioIn
  fft: p5.FFT
  sampleInterval: number
  lastSampleTime: number
  loudness: number
  centroid: number
  gate: number
  active: boolean

  constructor (sampleInterval = 300) {
    this.mic = new p5.AudioIn()
    this.fft = new p5.FFT(0.8, 64)
    this.fft.setInput(this.mic)

    this.sampleInterval = sampleInterval
    this.lastSampleTime = 0
    this.loudness = 0
    this.centroid = 0
    this.gate = 50
    this.active = false

    // 先静音启动
    this.mic.start(() => {
      this.mic.amp(0) // 初始静音
    })
  }

  async enable () {
    await (navigator as any).mediaDevices.getUserMedia({ audio: true })
    this.mic.amp(1) // 激活麦克风
  }

  sample (p5: p5Types) {
    const currentTime = p5.millis()
    if (currentTime - this.lastSampleTime >= this.sampleInterval) {
      this.lastSampleTime = currentTime
      const spectrum = this.fft.analyze()

      this.loudness = this.fft.getEnergy('lowMid', 'highMid')
      this.centroid = this.fft.getCentroid()

      this.active = this.loudness > this.gate
    }
    return { loudness: this.loudness, centroid: this.centroid }
  }
}

class CharCompo {
  constructor (points, mapfunc, type) {
    this.points = points
    this.mapfunc = mapfunc
    this.type = type
  }

  draw (p5: p5Types, center, loudness, centroid) {
    let { weight, smooth } = this.mapfunc(p5, loudness, centroid)

    //   for (let i = 0; i < this.points.length; i++) {
    //     let p = this.points[i]
    //     p5.fill(255, 0, 0)
    //     p5.ellipse(p[0], p[1], 5, 5)
    //   }
    // console.log(center, loudness, centroid)

    switch (this.type) {
      case CharType.BLOCK_W:
        {
          p5.fill(0)
          p5.rect(
            this.points[0][0] + center,
            this.points[0][1] + center / 2,
            this.points[1][0] - this.points[0][0] + weight,
            this.points[1][1] - this.points[0][1]
          )
        }
        break
      case CharType.BLOCK_H:
        {
          p5.fill(0)
          p5.rect(
            this.points[0][0] + center,
            this.points[0][1] + center / 2,
            this.points[1][0] - this.points[0][0],
            this.points[1][1] - this.points[0][1] + weight
          )
        }
        break
    }
  }
}

interface ComponentProps {
  className?: string
  globalInt?: number
  onIntChange?: (value: number) => void
}

const LRControlButtons: React.FC<{
  value: number
  onIncrement: () => void
  onDecrement: () => void
}> = ({ value, onIncrement, onDecrement }) => (
  <div>
    <div className='absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 flex z-10 '>
      <button
        onClick={onDecrement}
        className='w-8 h-8 clip-triangle-left hover:bg-blue-600 bg-[#0c75ff]'
      />
    </div>

    <div className='absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 flex z-10 '>
      <button
        onClick={onIncrement}
        className='w-8 h-8 clip-triangle-right hover:bg-blue-600 bg-[#0c75ff]'
      />
    </div>
  </div>
)

const MySketch: React.FC<ComponentProps> = ({ className }) => {
  const [globalInt, setGlobalInt] = useState(0)
  const [audioAllowed, setAudioAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const samplerRef = useRef<Sampler>()
  const globalIntRef = useRef(globalInt)

  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState(800)
  const canvasSizeRef = useRef(canvasSize)

  const handleResize = () => {
    // const { width, height } = containerRef.current.getBoundingClientRect()
    // setCanvasSize(Math.min(width, height))
    setCanvasSize(800)
  }

  // 同步ref值
  useEffect(() => {
    globalIntRef.current = globalInt
  }, [globalInt])
  useEffect(() => {
    canvasSizeRef.current = canvasSize
  }, [canvasSize])

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(canvasSizeRef.current, canvasSizeRef.current).parent(
      canvasParentRef
    )
    samplerRef.current = new Sampler(10)
    setIsLoading(false)

    window.addEventListener('resize', handleResize)
  }

  const draw = (p5: p5Types) => {
    if (p5.width !== canvasSizeRef.current) {
      p5.resizeCanvas(canvasSizeRef.current, canvasSizeRef.current)
    }

    p5.background(255)
    const data = samplerRef.current?.sample(p5)

    qiData.forEach(char => {
      char.draw(p5, p5.width / 2, data.loudness, data.centroid)
    })
  }

  // 清理音频资源
  useEffect(() => {
    return () => {
      samplerRef.current?.mic.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!isLoading && (
        <LRControlButtons
          value={globalInt}
          onIncrement={() => setGlobalInt(prev => prev + 1)}
          onDecrement={() => setGlobalInt(prev => prev - 1)}
        />
      )}

      {isLoading && (
        <div className='inset-0 bg-gray-100 flex items-center justify-center'>
          Loading audio...
        </div>
      )}

      {!isLoading && !audioAllowed && (
        <button
          className='absolute bottom-[10px] left-1/2 -translate-x-1/2 flex gap-8 z-10'
          onClick={async () => {
            await samplerRef.current?.enable()
            setAudioAllowed(true)
          }}
        >
          START
        </button>
      )}

      <Sketch setup={setup} draw={draw} />
    </div>
  )
}

let qiData = [
  new CharCompo(
    [
      [99.2074, 85.0394],
      [99.2074, 141.732]
    ],
    (p5: p5Types, loudness, centroid) => {
      let w = p5.map(centroid, 0, 8000, 10, 30)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_W
  ),
  new CharCompo(
    [
      [99.2074, 141.732],
      [240.02, 141.732]
    ],
    (p5: p5Types, loudness, centroid) => {
      let w = p5.map(loudness, 0, 150, 2, 30)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H
  ),
  new CharCompo(
    [
      [99.2074, 184.252],
      [241.869, 184.252]
    ],
    (p5: p5Types, loudness, centroid) => {
      let w = p5.map(loudness, 0, 150, 2, 30)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H
  ),
  new CharCompo(
    [
      [99.2074, 226.771],
      [240.95, 226.771]
    ],
    (p5: p5Types, loudness, centroid) => {
      let w = p5.map(loudness, 0, 150, 2, 30)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H
  )
]

export default MySketch
