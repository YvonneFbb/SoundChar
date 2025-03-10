'use client'

import React, { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Sketch = dynamic(
  () =>
    import('react-p5').then(mod => {
      if (typeof window !== 'undefined' && !window.p5SoundLoaded) {
        require('../../public/p5.sound.min')
        require('../../public/p5.bezier.min')

        window.p5SoundLoaded = true // 标记只加载一次
      }
      return mod.default
    }),
  { ssr: false }
)

class Sampler {
  constructor (p5Inst, sampleInterval = 300) {
    this.mic = new window.p5.AudioIn()
    this.fft = new window.p5.FFT(0.8, 64)
    this.fft.setInput(this.mic)
    this.p5 = p5Inst

    this.sampleInterval = sampleInterval
    this.lastSampleTime = 0
    this.loudness = 0
    this.centroid = 0
    this.gate = 50
    this.active = false
  }

  async enable () {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.start(() => {
      this.mic.amp(0.8)
    })
  }

  async stop () {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.stop()
  }

  sample () {
    const currentTime = this.p5.millis()
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

const CharType = {
  BLOCK_W: 'BLOCK_W',
  BLOCK_H: 'BLOCK_H',
  BEZIER: 'BEZIER'
}

class CharCompo {
  constructor (points, mapfunc, type, size) {
    let s = size[0] >= size[1] ? size[0] : size[1]
    for (let i = 0; i < points.length; i++) {
      points[i][0] /= s
      points[i][1] /= s
    }

    this.points = points
    this.mapfunc = mapfunc
    this.type = type
    this.size = [size[0] / s, size[1] / s]
  }

  draw (p5Inst, loudness, centroid) {
    const { weight, smooth } = this.mapfunc(p5Inst, loudness, centroid)
    let s =
      this.size[0] >= this.size[1] * 0.8
        ? p5Inst.width * 0.3
        : p5Inst.height * 0.3
    let points = this.points.map(p => {
      return [p[0] * s, p[1] * s]
    })

    switch (this.type) {
      case CharType.BLOCK_W:
        p5Inst.fill(0)
        p5Inst.rect(
          points[0][0] + p5Inst.width * 0.5 - this.size[0] * s * 0.5 - 10,
          points[0][1] + p5Inst.height * 0.42 - this.size[1] * s * 0.5,
          points[1][0] - points[0][0] + weight,
          points[1][1] - points[0][1]
        )
        break
      case CharType.BLOCK_H:
        p5Inst.fill(0)
        p5Inst.rect(
          points[0][0] + p5Inst.width * 0.5 - this.size[0] * s * 0.5 - 10,
          points[0][1] + p5Inst.height * 0.42 - this.size[1] * s * 0.5,
          points[1][0] - points[0][0],
          points[1][1] - points[0][1] + weight
        )
        break
    }
  }
}

const LRControlButtons = ({ onIncrement, onDecrement }) => (
  <div>
    <div className='absolute top-1/2 left-32 -translate-x-1/2 -translate-y-1/2 z-10'>
      <button onClick={onDecrement}>
        <svg width='40' height='40' viewBox='0 0 100 100'>
          {/* 这里的三角形顶点在 (20,50) 为指向左边，
              另外两个点在 (80,20) 和 (80,80)，构成一个较为接近正三角形的形状 */}
          <polygon
            points='20,50 80,20 80,80'
            fill='#0c75ff'
            stroke='black'
            strokeWidth='3'
          />
        </svg>
      </button>
    </div>
    <div className='absolute top-1/2 right-32 -translate-x-1/2 -translate-y-1/2 z-10'>
      <button onClick={onIncrement}>
        <svg width='40' height='40' viewBox='0 0 100 100'>
          {/* 这里的三角形顶点在 (80,50) 为指向右边，
              另外两个点在 (20,20) 和 (20,80) */}
          <polygon
            points='80,50 20,20 20,80'
            fill='#0c75ff'
            stroke='black'
            strokeWidth='3'
          />
        </svg>
      </button>
    </div>
  </div>
)

const MySketch = ({ className }) => {
  const [globalInt, setGlobalInt] = useState(0)
  const [audioAllowed, setAudioAllowed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const samplerRef = useRef()
  const globalIntRef = useRef(globalInt)

  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState([800, 800])
  const canvasSizeRef = useRef(canvasSize)

  const handleResize = () => {
    const { width, height } = containerRef.current.getBoundingClientRect()
    setCanvasSize([width, height])
  }

  useEffect(() => {
    globalIntRef.current = globalInt
  }, [globalInt])
  useEffect(() => {
    canvasSizeRef.current = canvasSize
  }, [canvasSize])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const setup = (p5Inst, canvasParentRef) => {
    const canvas = p5Inst.createCanvas(
      canvasSizeRef.current,
      canvasSizeRef.current
    )
    canvas.parent(canvasParentRef)
    samplerRef.current = new Sampler(p5Inst, 10)
    setIsLoading(false)

    p5Inst.getAudioContext().suspend()
  }

  const draw = p5Inst => {
    if (
      p5Inst.width !== canvasSizeRef.current[0] ||
      p5Inst.height !== canvasSizeRef.current[1]
    ) {
      p5Inst.resizeCanvas(canvasSizeRef.current[0], canvasSizeRef.current[1])
    }
    p5Inst.background(255)
    const data = samplerRef.current?.sample(p5Inst)
    if (!data) return

    charData[globalIntRef.current].forEach(char => {
      char.draw(p5Inst, data.loudness, data.centroid)
    })
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {!isLoading && (
        <LRControlButtons
          onIncrement={() =>
            setGlobalInt(prev =>
              prev >= charData.length - 1 ? prev : prev + 1
            )
          }
          onDecrement={() => setGlobalInt(prev => (prev < 1 ? prev : prev - 1))}
        />
      )}

      {isLoading && (
        <div className='inset-0 bg-gray-100 flex items-center justify-center'>
          Loading audio...
        </div>
      )}

      {!isLoading && (
        <button
          className='absolute text-xl font-bold bottom-1/4 left-1/2 -translate-x-1/2 flex gap-8 z-10'
          onClick={async () => {
            if (!audioAllowed) {
              // 如果音频未开启，则启动音频
              await samplerRef.current?.enable()
              setAudioAllowed(true)
            } else {
              // 如果音频已开启，则暂停/停止麦克风输入
              samplerRef.current?.mic.stop()
              setAudioAllowed(false)
            }
          }}
        >
          {audioAllowed ? 'PAUSE' : 'START'}
        </button>
      )}

      <Sketch setup={setup} draw={draw} />
    </div>
  )
}

let qiData = [
  new CharCompo(
    [
      [0, 0],
      [0, 56]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(centroid, 0, 8000, 10, 80)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_W,
    [140, 140]
  ),
  new CharCompo(
    [
      [0, 56],
      [140, 56]
    ],
    (p5Inst, loudness, centroid) => {
      let w
      if (loudness < 60) {
        w = p5Inst.map(loudness, 0, 60, 10, 20)
      } else {
        w = p5Inst.map(loudness, 60, 180, 20, 1)
      }

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H,
    [140, 140]
  ),
  new CharCompo(
    [
      [0, 98],
      [140, 98]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(loudness, 0, 150, 10, 60)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H,
    [140, 140]
  ),
  new CharCompo(
    [
      [0, 140],
      [140, 140]
    ],
    (p5Inst, loudness, centroid) => {
      let w = p5Inst.map(loudness, 0, 150, 10, 15)

      return {
        weight: w,
        smooth: 3
      }
    },
    CharType.BLOCK_H,
    [140, 140]
  )
]

let charData = [qiData]

export default MySketch
