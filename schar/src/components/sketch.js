'use client'

import React, { useRef, useState, useEffect } from 'react'
import initBezier from 'p5bezier'
import dynamic from 'next/dynamic'

import { charData, DefaultWidth } from './chardata'

/* For pic taking only */
let takePic = false
let cnt = 0
let lCnt = 0
let lCntMax = 18
let cCnt = 0
let cCntMax = 10

const Sketch = dynamic(
  () =>
    import('react-p5').then(mod => {
      if (typeof window !== 'undefined' && !window.p5SoundLoaded) {
        require('p5/lib/addons/p5.sound.min')

        window.p5SoundLoaded = true // 标记只加载一次
      }
      return mod.default
    }),
  { ssr: false }
)

class Sampler {
  constructor(p5Inst, sampleInterval = 300) {
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

  async enable() {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.start(() => {
      this.mic.amp(0.8)
    })
  }

  async stop() {
    await this.p5.userStartAudio()
    await navigator.mediaDevices.getUserMedia({ audio: true })
    this.mic.stop()
  }

  sample() {
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
    <div className='absolute top-1/2 right-24 -translate-x-1/2 -translate-y-1/2 z-10'>
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
  const [canvasSize, setCanvasSize] = useState([800, 800])
  const [colorOn, setColorOn] = useState(false)

  const samplerRef = useRef()
  const p5bezierRef = useRef()
  const globalIntRef = useRef(globalInt)
  const containerRef = useRef(null)
  const canvasSizeRef = useRef(canvasSize)

  const handleResize = () => {
    const { width, height } = containerRef.current.getBoundingClientRect()
    setCanvasSize([width, height])
  }

  const drawGrid = (p5Inst, gridSize = 30) => {
    p5Inst.push();
    p5Inst.stroke(220); // 浅灰色网格线
    p5Inst.strokeWeight(0.5);

    // 绘制水平线
    for (let y = 0; y < p5Inst.height; y += gridSize) {
      p5Inst.line(0, y, p5Inst.width, y);
    }

    // 绘制垂直线
    for (let x = 0; x < p5Inst.width; x += gridSize) {
      p5Inst.line(x, 0, x, p5Inst.height);
    }

    p5Inst.pop();
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
    const canvas = p5Inst
      .createCanvas(canvasSizeRef.current, canvasSizeRef.current)
      .parent(canvasParentRef)
    samplerRef.current = new Sampler(p5Inst, 5)
    p5bezierRef.current = initBezier(canvas)

    setIsLoading(false)

    p5Inst.getAudioContext().suspend()
  }

  const draw = p5Inst => {
    const gridSize = 30
    if (
      p5Inst.width !== canvasSizeRef.current[0] ||
      p5Inst.height !== canvasSizeRef.current[1]
    ) {
      p5Inst.resizeCanvas(canvasSizeRef.current[0], canvasSizeRef.current[1])
    }
    p5Inst.background(255)
    drawGrid(p5Inst, DefaultWidth)

    const data = samplerRef.current?.sample(p5Inst)
    if (takePic && audioAllowed && lCnt <= lCntMax && cCnt <= cCntMax) {
      data.centroid = cCnt * 1000
      data.loudness = lCnt * 10
      cnt += 1
    }

    charData[globalIntRef.current].draw(
      p5Inst,
      [canvasSizeRef.current[0] / gridSize, canvasSizeRef.current[1] / gridSize, gridSize],
      data.loudness,
      data.centroid,
      colorOn
    )

    if (takePic && cnt >= 15) {
      if (audioAllowed && lCnt <= lCntMax && cCnt <= cCntMax) {
        p5Inst.saveCanvas(
          'myCanvas' + '-' + data.centroid + '-' + data.loudness,
          'png'
        )
      }

      cnt = 0
      lCnt += 1
      if (lCnt > lCntMax) {
        cCnt += 1
        lCnt = 0
      }
    }
  }

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className}`}>
      {!isLoading && (
        <LRControlButtons
          onIncrement={() => {
            setGlobalInt(prev =>
              prev >= charData.length - 1 ? prev : prev + 1
            )
          }}
          onDecrement={() => setGlobalInt(prev => (prev < 1 ? prev : prev - 1))}
        />
      )}

      {isLoading && (
        <div className='inset-0 bg-gray-100 flex items-center justify-center'>
          Loading audio...
        </div>
      )}

      {!isLoading && (
        <div className='fixed top-[80px] right-4 transform -translate-y-1/2'>
          <div
            onClick={() => setColorOn(!colorOn)}
            className='relative w-8 h-5 flex items-center rounded-full p-1 cursor-pointer overflow-hidden border-[1px] border-black'
          >
            {/* 背景层 */}
            <div
              className={`absolute inset-0 transition-opacity ${colorOn
                ? 'opacity-100 bg-gradient-to-tr from-[#0c75ff] to-[#f6c7ac]'
                : 'opacity-0 bg-gradient-to-tr from-[#0c75ff] to-[#f6c7ac]'
                }`}
            />
            <div
              className={`absolute inset-0 transition-opacity bg-black ${colorOn ? 'opacity-0' : 'opacity-100'
                }`}
            />
            {/* 圆形滑块 */}
            <div
              className={`relative bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${colorOn ? 'translate-x-[9px]' : 'translate-x-[-3px]'
                }`}
            ></div>
          </div>
        </div>
      )}

      {!isLoading && (
        <p className='absolute text-2xl font-bold top-20 left-1/2 -translate-x-1/2 z-10 song-font'>
          {charData[globalInt].name}
        </p>
      )}

      {!isLoading && (
        <button
          className='absolute text-xl font-bold bottom-1/4 left-1/2 -translate-x-1/2 translate-y-8 flex gap-8 z-10'
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

export default MySketch