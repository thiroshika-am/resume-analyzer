'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  glowAmt: number
}

interface Connection {
  x1: number
  y1: number
  x2: number
  y2: number
  alpha: number
}

interface Ripple {
  x: number
  y: number
  r: number
  maxR: number
  alpha: number
}

interface DataStream {
  fromX: number
  fromY: number
  toX: number
  toY: number
  progress: number
  speed: number
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 180, active: false })
  const [bgState, setBgState] = useState<'idle' | 'scanning' | 'success'>('idle')
  const bgStateRef = useRef<'idle' | 'scanning' | 'success'>('idle')

  useEffect(() => {
    bgStateRef.current = bgState
  }, [bgState])

  useEffect(() => {
    const handleBgState = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && customEvent.detail.state) {
        setBgState(customEvent.detail.state)
        if (customEvent.detail.state === 'success') {
          setTimeout(() => {
            setBgState('idle')
          }, 3500)
        }
      }
    }

    window.addEventListener('bg-state', handleBgState)
    return () => {
      window.removeEventListener('bg-state', handleBgState)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const nodes: Node[] = []
    const ripples: Ripple[] = []
    const streams: DataStream[] = []

    // 380 nodes for high density network
    const nodeCount = 380
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15, // Muted speed for smooth technical drift
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 1.5 + 1.0,
        glowAmt: 0,
      })
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      mouseRef.current.active = true
    }

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000
      mouseRef.current.y = -1000
      mouseRef.current.active = false
    }

    const handleCanvasClick = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        r: 0,
        maxR: 150,
        alpha: 0.35,
      })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('click', handleCanvasClick)

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      const activeState = bgStateRef.current
      const isScanning = activeState === 'scanning'
      const isSuccess = activeState === 'success'

      // 1. Draw Technical Blueprint Grid Lines (subtle but defined)
      ctx.save()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.022)'
      ctx.lineWidth = 0.5
      
      const gridSpacing = 55
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      ctx.restore()

      // 2. Update Nodes drift & cursor pull
      const mouse = mouseRef.current
      nodes.forEach((node) => {
        node.x += node.vx * (isScanning ? 3 : 1)
        node.y += node.vy * (isScanning ? 3 : 1)

        // Boundary Wrap
        if (node.x < 0) node.x = width
        if (node.x > width) node.x = 0
        if (node.y < 0) node.y = height
        if (node.y > height) node.y = 0

        // Magnetic Attraction
        if (mouse.active) {
          const dx = mouse.x - node.x
          const dy = mouse.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < mouse.radius) {
            const pullForce = (mouse.radius - dist) / mouse.radius
            node.x += (dx / dist) * pullForce * 0.9
            node.y += (dy / dist) * pullForce * 0.9
            node.glowAmt = Math.min(1, node.glowAmt + 0.08)
          } else {
            node.glowAmt = Math.max(0, node.glowAmt - 0.04)
          }
        } else {
          node.glowAmt = Math.max(0, node.glowAmt - 0.04)
        }
      })

      // 3. Spatial Partitioning: Bin nodes into grid cells
      const cellSize = 100
      const cols = Math.ceil(width / cellSize)
      const rows = Math.ceil(height / cellSize)
      const grid: Node[][] = Array.from({ length: cols * rows }, () => [])

      nodes.forEach((node) => {
        const col = Math.floor(node.x / cellSize)
        const row = Math.floor(node.y / cellSize)
        if (col >= 0 && col < cols && row >= 0 && row < rows) {
          grid[col + row * cols].push(node)
        }
      })

      // 4. Query connections
      const connectDist = 95
      const connectionList: Connection[] = []

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const currentCellIndex = c + r * cols
          const currentNodes = grid[currentCellIndex]

          if (!currentNodes || currentNodes.length === 0) continue

          const neighbors = [
            { c, r },
            { c: c + 1, r },
            { c: c - 1, r: r + 1 },
            { c, r: r + 1 },
            { c: c + 1, r: r + 1 },
          ]

          currentNodes.forEach((n1) => {
            neighbors.forEach(({ c: nc, r: nr }) => {
              if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
                const neighborNodes = grid[nc + nr * cols]
                neighborNodes.forEach((n2) => {
                  if (n1 === n2) return

                  const dx = n1.x - n2.x
                  const dy = n1.y - n2.y
                  const dist = Math.sqrt(dx * dx + dy * dy)

                  if (dist < connectDist) {
                    // Muted but clearly visible connection lines
                    let baseAlpha = (1 - dist / connectDist) * 0.12
                    
                    if (n1.glowAmt > 0 || n2.glowAmt > 0) {
                      baseAlpha += Math.max(n1.glowAmt, n2.glowAmt) * 0.15
                    }

                    if (isScanning) {
                      baseAlpha += 0.08
                    }

                    connectionList.push({
                      x1: n1.x,
                      y1: n1.y,
                      x2: n2.x,
                      y2: n2.y,
                      alpha: baseAlpha,
                    })

                    // Silver stream data flows
                    const spawnChance = isScanning ? 0.0055 : 0.00018
                    if (Math.random() < spawnChance) {
                      streams.push({
                        fromX: n1.x,
                        fromY: n1.y,
                        toX: n2.x,
                        toY: n2.y,
                        progress: 0,
                        speed: isScanning ? 0.035 : 0.012,
                      })
                    }
                  }
                })
              }
            })
          })
        }
      }

      // 5. Draw connection lines
      ctx.save()
      ctx.lineWidth = 0.5
      connectionList.forEach((conn) => {
        ctx.strokeStyle = isSuccess ? '#10B981' : '#FFFFFF'
        ctx.globalAlpha = conn.alpha
        ctx.beginPath()
        ctx.moveTo(conn.x1, conn.y1)
        ctx.lineTo(conn.x2, conn.y2)
        ctx.stroke()
      })
      ctx.restore()

      // 6. Draw active streams
      ctx.save()
      for (let sIdx = streams.length - 1; sIdx >= 0; sIdx--) {
        const stream = streams[sIdx]
        stream.progress += stream.speed

        if (stream.progress >= 1) {
          streams.splice(sIdx, 1)
          continue
        }

        const sx = stream.fromX + (stream.toX - stream.fromX) * stream.progress
        const sy = stream.fromY + (stream.toY - stream.fromY) * stream.progress

        ctx.fillStyle = isSuccess ? 'rgba(16, 185, 129, 0.8)' : 'rgba(255, 255, 255, 0.7)'
        ctx.beginPath()
        ctx.arc(sx, sy, 2.0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // 7. Draw ripples
      ctx.save()
      for (let rIdx = ripples.length - 1; rIdx >= 0; rIdx--) {
        const rip = ripples[rIdx]
        rip.r += 2.5
        rip.alpha -= 0.012

        if (rip.alpha <= 0 || rip.r >= rip.maxR) {
          ripples.splice(rIdx, 1)
          continue
        }

        ctx.strokeStyle = '#FFFFFF'
        ctx.globalAlpha = rip.alpha
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, rip.r, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      // 8. Draw nodes
      ctx.save()
      nodes.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + (node.glowAmt * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = isSuccess 
          ? 'rgba(16, 185, 129, 0.5)' 
          : node.glowAmt > 0 
          ? 'rgba(255, 255, 255, 0.65)' 
          : 'rgba(255, 255, 255, 0.22)'
        ctx.fill()
      })
      ctx.restore()

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('click', handleCanvasClick)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-30 pointer-events-none transition-opacity duration-1000 bg-[#0F172A]"
      style={{
        background: 'radial-gradient(circle at 50% 50%, #111827 0%, #0F172A 100%)',
      }}
    />
  )
}
