import { useEffect, useRef, useState } from 'react'
import './App.css'

const STORY = { width: 1080, height: 1920 }

const LAYOUTS = [
  { name: 'Camera Roll', detail: 'Mix & match frames', color: '#ded5c2' },
  { name: 'After Hours', detail: 'Film roll · blurred bg', color: '#353331' },
  { name: 'Photo Dump', detail: 'Scrapbook freestyle', color: '#f1c9c4' },
  { name: 'Main Character', detail: 'One big, many mini', color: '#b6c6b1' },
  { name: 'Photo Backdrop', detail: 'Film + photo background', color: '#696354' },
  { name: 'Weekend Edit', detail: 'Circles & cutouts', color: '#e9d8a9' },
  { name: 'Moodboard', detail: 'Overlapping polaroids', color: '#b4a5c9' },
  { name: 'Contact Sheet', detail: 'Film-roll mosaic', color: '#d7d1c4' },
  { name: 'Soft Life', detail: 'Asymmetric mix', color: '#c7d5d1' },
  { name: 'Camera Roll 2.0', detail: 'Scrapbook frames', color: '#cf9e8f' },
]

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ name: file.name, url, image })
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Foto "${file.name}" tidak bisa dibuka.`))
    }
    image.src = url
  })
}

function drawCover(ctx, image, x, y, width, height, radius = 0) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale

  ctx.save()
  ctx.beginPath()
  if (radius === 'circle') {
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
  } else if (radius === 'arch') {
    ctx.moveTo(x, y + height)
    ctx.lineTo(x, y + width / 2)
    ctx.arc(x + width / 2, y + width / 2, width / 2, Math.PI, 0)
    ctx.lineTo(x + width, y + height)
    ctx.closePath()
  } else {
    ctx.roundRect(x, y, width, height, radius)
  }
  ctx.clip()
  ctx.drawImage(
    image,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  )
  ctx.restore()
}

function drawPhotoBackdrop(ctx, image, width, height, tint = 'rgba(31, 29, 26, 0.34)') {
  ctx.save()
  ctx.filter = 'blur(34px) saturate(0.78)'
  drawCover(ctx, image, -54, -54, width + 108, height + 108)
  ctx.restore()
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, width, height)
}

function drawGingham(ctx, width, height, firstColor, secondColor, size = 72) {
  ctx.fillStyle = firstColor
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = secondColor
  const stripe = size * 0.4
  for (let x = 0; x < width; x += size) ctx.fillRect(x, 0, stripe, height)
  for (let y = 0; y < height; y += size) ctx.fillRect(0, y, width, stripe)
}

function drawPaperGrain(ctx, width, height, color = 'rgba(91, 73, 52, 0.1)') {
  let seed = 17
  ctx.fillStyle = color
  for (let index = 0; index < 460; index += 1) {
    seed = (seed * 9301 + 49297) % 233280
    const x = (seed / 233280) * width
    seed = (seed * 9301 + 49297) % 233280
    const y = (seed / 233280) * height
    ctx.fillRect(x, y, 2, 2)
  }
}

function drawTape(ctx, centerX, centerY, width, color = 'rgba(246, 225, 164, 0.9)', rotation = -0.08) {
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(rotation)
  ctx.fillStyle = color
  ctx.fillRect(-width / 2, -13, width, 26)
  ctx.globalAlpha = 0.28
  ctx.fillStyle = '#fff'
  for (let x = -width / 2 + 8; x < width / 2; x += 16) {
    ctx.fillRect(x, -13, 3, 26)
  }
  ctx.restore()
  ctx.globalAlpha = 1
}

function drawSparkle(ctx, x, y, scale, color) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -scale)
  ctx.quadraticCurveTo(scale * 0.12, -scale * 0.12, scale, 0)
  ctx.quadraticCurveTo(scale * 0.12, scale * 0.12, 0, scale)
  ctx.quadraticCurveTo(-scale * 0.12, scale * 0.12, -scale, 0)
  ctx.quadraticCurveTo(-scale * 0.12, -scale * 0.12, 0, -scale)
  ctx.fill()
  ctx.restore()
}

function drawDoodle(ctx, x, y, scale, color) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, scale * 0.08)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(x - scale, y - scale * 0.15)
  ctx.quadraticCurveTo(x - scale * 0.8, y - scale, x, y - scale * 0.48)
  ctx.quadraticCurveTo(x + scale * 0.8, y - scale, x + scale, y - scale * 0.15)
  ctx.quadraticCurveTo(x + scale * 0.85, y + scale * 0.48, x, y + scale)
  ctx.quadraticCurveTo(x - scale * 0.85, y + scale * 0.48, x - scale, y - scale * 0.15)
  ctx.stroke()
  ctx.restore()
}

function makePhotoRects(area, count, composition) {
  const { x, y, width, height, gap = 16 } = area
  const cellGrid = (indexes, region, columns) => {
    if (!indexes.length) return []
    const rows = Math.ceil(indexes.length / columns)
    const cellWidth = (region.width - gap * (columns - 1)) / columns
    const cellHeight = (region.height - gap * (rows - 1)) / rows
    return indexes.map((index, position) => {
      const row = Math.floor(position / columns)
      const firstInRow = row * columns
      const itemsInRow = Math.min(columns, indexes.length - firstInRow)
      const rowWidth = itemsInRow * cellWidth + (itemsInRow - 1) * gap
      const rowX = region.x + (region.width - rowWidth) / 2
      return {
        index,
        x: rowX + (position % columns) * (cellWidth + gap),
        y: region.y + row * (cellHeight + gap),
        width: cellWidth,
        height: cellHeight,
      }
    })
  }
  const remainingGrid = (firstIndex, region, columns) => (
    cellGrid(
      Array.from({ length: count - firstIndex }, (_, index) => firstIndex + index),
      region,
      columns,
    )
  )

  if (composition === 'flow') {
    if (count === 1) return [{ index: 0, x: x + width * 0.08, y: y + height * 0.03, width: width * 0.84, height: height * 0.94, shape: 'arch' }]
    if (count === 2) {
      return [
        { index: 0, x: x + width * 0.03, y: y + height * 0.04, width: width * 0.7, height: height * 0.64 },
        { index: 1, x: x + width * 0.51, y: y + height * 0.61, width: width * 0.45, height: height * 0.34, shape: 'circle' },
      ]
    }
    const heroHeight = height * 0.49
    const sideWidth = width * 0.29
    const heroWidth = width * 0.65
    const items = [
      { index: 0, x: x + width * 0.02, y: y + height * 0.02, width: heroWidth, height: heroHeight },
      { index: 1, x: x + width * 0.68, y: y + height * 0.04, width: sideWidth, height: heroHeight * 0.46, shape: 'arch' },
      { index: 2, x: x + width * 0.68, y: y + height * 0.53, width: sideWidth, height: heroHeight * 0.46, shape: 'circle' },
    ]
    if (count > 3) {
      items.push(...remainingGrid(3, {
        x: x + width * 0.02,
        y: y + heroHeight + height * 0.09,
        width: width * 0.96,
        height: height * 0.4,
      }, count <= 5 ? count - 3 : 3))
    }
    return items
  }

  if (composition === 'film-roll') {
    const columns = count <= 3 ? 1 : count <= 6 ? 2 : 3
    return cellGrid(Array.from({ length: count }, (_, index) => index), {
      x, y, width, height,
    }, columns).map((item) => ({
      ...item,
      shape: item.index % 5 === 4 ? 'circle' : 'rect',
    }))
  }

  if (composition === 'circles') {
    if (count === 1) {
      const diameter = Math.min(width * 0.82, height * 0.62)
      return [{
        index: 0,
        x: x + (width - diameter) / 2,
        y: y + (height - diameter) / 2,
        width: diameter,
        height: diameter,
        shape: 'circle',
      }]
    }
    const leadSize = Math.min(width * 0.62, height * 0.42)
    const items = [{
      index: 0,
      x: x + width * 0.05,
      y: y + height * 0.02,
      width: leadSize,
      height: leadSize,
      shape: 'circle',
    }]
    if (count > 1) {
      items.push({
        index: 1,
        x: x + width * 0.56,
        y: y + height * 0.1,
        width: width * 0.38,
        height: height * 0.3,
        shape: 'arch',
      })
    }
    if (count > 2) {
      items.push(...remainingGrid(2, {
        x: x + width * 0.04,
        y: y + height * 0.51,
        width: width * 0.92,
        height: height * 0.44,
      }, count <= 4 ? 2 : 3).map((item, index) => ({
        ...item,
        shape: index % 3 === 1 ? 'circle' : 'rect',
      })))
    }
    return items
  }

  if (composition === 'orbit') {
    if (count === 1) {
      const diameter = Math.min(width * 0.8, height * 0.56)
      return [{
        index: 0,
        x: x + (width - diameter) / 2,
        y: y + (height - diameter) / 2,
        width: diameter,
        height: diameter,
        shape: 'circle',
      }]
    }
    const items = [{
      index: 0,
      x: x + width * 0.27,
      y: y + height * 0.06,
      width: width * 0.46,
      height: height * 0.34,
      shape: 'circle',
    }]
    const remaining = Array.from({ length: count - 1 }, (_, index) => index + 1)
    const columns = count <= 4 ? 2 : 3
    const orbit = cellGrid(remaining, {
      x: x + width * 0.04,
      y: y + height * 0.46,
      width: width * 0.92,
      height: height * 0.48,
    }, columns)
    orbit.forEach((item, index) => {
      item.shape = index % 4 === 2 ? 'circle' : 'rect'
      item.x += (index % 2 === 0 ? -1 : 1) * width * 0.012
      item.y += (index % 2 === 0 ? 1 : -1) * height * 0.015
    })
    return [...items, ...orbit]
  }

  if (composition === 'mosaic-flow') {
    const rows = count <= 4 ? 2 : count <= 7 ? 3 : 4
    const rowCounts = Array.from({ length: rows }, (_, row) => (
      Math.floor(count / rows) + (row < count % rows ? 1 : 0)
    ))
    const rowWeights = rowCounts.map((rowCount, row) => (
      rowCount === 1 ? 1.12 : row % 2 === 0 ? 0.88 : 1.12
    ))
    const availableHeight = height - gap * (rows - 1)
    const totalWeight = rowWeights.reduce((sum, weight) => sum + weight, 0)
    let currentY = y
    let index = 0
    return rowCounts.flatMap((rowCount, row) => {
      const rowHeight = availableHeight * rowWeights[row] / totalWeight
      const widths = rowCount === 1
        ? [width * 0.68]
        : Array.from({ length: rowCount }, (_, column) => (
          width * (column === 0 && row % 2 === 0 ? 0.42 : 1 / rowCount)
        ))
      const totalWidth = widths.reduce((sum, itemWidth) => sum + itemWidth, 0)
      const scale = Math.min(1, (width - gap * (rowCount - 1)) / totalWidth)
      const scaledWidths = widths.map((itemWidth) => itemWidth * scale)
      const rowWidth = scaledWidths.reduce((sum, itemWidth) => sum + itemWidth, 0) + gap * (rowCount - 1)
      let currentX = x + (width - rowWidth) / 2
      const placements = scaledWidths.map((itemWidth, column) => {
        const placement = {
          index,
          x: currentX,
          y: currentY + (column % 2) * rowHeight * 0.025,
          width: itemWidth,
          height: rowHeight * (1 - (column % 2) * 0.05),
          shape: index % 6 === 4 ? 'circle' : 'rect',
        }
        currentX += itemWidth + gap
        index += 1
        return placement
      })
      currentY += rowHeight + gap
      return placements
    })
  }

  if (composition === 'overlap') {
    const columns = count <= 4 ? 2 : 3
    const rows = Math.ceil(count / columns)
    const cellWidth = (width - gap * (columns - 1)) / columns
    const cellHeight = (height - gap * (rows - 1)) / rows
    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / columns)
      const column = index % columns
      const insetX = (index % 2) * width * 0.025
      const insetY = (index % 3) * height * 0.012
      return {
        index,
        x: x + column * (cellWidth + gap) + insetX,
        y: y + row * (cellHeight + gap) + insetY,
        width: cellWidth - insetX,
        height: cellHeight - insetY,
        shape: index % 5 === 2 ? 'circle' : 'rect',
        rotation: index % 2 === 0 ? -2.5 : 2.5,
      }
    })
  }

  if (count === 1) return [{ index: 0, x, y, width, height }]

  if (composition === 'feature-top' || composition === 'cover') {
    const leadHeight = height * (count === 2 ? 0.65 : 0.57)
    const columns = count <= 3 ? count - 1 : 3
    return [
      { index: 0, x, y, width, height: leadHeight - gap / 2 },
      ...remainingGrid(1, {
        x,
        y: y + leadHeight + gap / 2,
        width,
        height: height - leadHeight - gap / 2,
      }, columns),
    ]
  }

  if (composition === 'feature-left' || composition === 'feature-right') {
    const leadWidth = width * 0.57
    const sideWidth = width - leadWidth - gap
    const leadX = composition === 'feature-left' ? x : x + sideWidth + gap
    const sideX = composition === 'feature-left' ? x + leadWidth + gap : x
    const sideColumns = count <= 4 ? 1 : 2
    return [
      { index: 0, x: leadX, y, width: leadWidth, height },
      ...remainingGrid(1, { x: sideX, y, width: sideWidth, height }, sideColumns),
    ]
  }

  if (composition === 'masonry') {
    const columns = count <= 5 ? 2 : count <= 8 ? 3 : 4
    const columnWidth = (width - gap * (columns - 1)) / columns
    const columnItems = Array.from({ length: columns }, () => [])
    for (let index = 0; index < count; index += 1) {
      const column = index < columns ? index : index % columns
      columnItems[column].push(index)
    }
    return columnItems.flatMap((indexes, column) => {
      const heightWeights = indexes.map((_, position) => (
        (position + column) % 2 === 0 ? 1.2 : 0.8
      ))
      const availableHeight = height - gap * (indexes.length - 1)
      const totalWeight = heightWeights.reduce((sum, weight) => sum + weight, 0)
      let top = y
      return indexes.map((index, position) => {
        const itemHeight = availableHeight * heightWeights[position] / totalWeight
        const rect = {
          index,
          x: x + column * (columnWidth + gap),
          y: top,
          width: columnWidth,
          height: itemHeight,
        }
        top += itemHeight + gap
        return rect
      })
    })
  }

  if (composition === 'strips') {
    const columns = count <= 3 ? 1 : 2
    return cellGrid(Array.from({ length: count }, (_, index) => index), {
      x, y, width, height,
    }, columns)
  }

  if (composition === 'collage') {
    const columns = count <= 3 ? 2 : count <= 6 ? 2 : 3
    const heroHeight = height * (count <= 3 ? 0.59 : 0.52)
    const lowerRows = Math.ceil((count - 1) / columns)
    const tileWidth = (width - gap * (columns - 1)) / columns
    const tileHeight = (height - heroHeight - gap * lowerRows) / lowerRows
    const items = [{
      index: 0,
      x: x + width * 0.08,
      y: y + 22,
      width: width * 0.84,
      height: heroHeight - 22,
    }]
    for (let index = 1; index < count; index += 1) {
      const position = index - 1
      const row = Math.floor(position / columns)
      const itemsInRow = Math.min(columns, count - 1 - row * columns)
      const rowWidth = itemsInRow * tileWidth + (itemsInRow - 1) * gap
      items.push({
        index,
        x: x + (width - rowWidth) / 2 + (position % columns) * (tileWidth + gap),
        y: y + heroHeight + gap + row * (tileHeight + gap),
        width: tileWidth,
        height: tileHeight,
      })
    }
    return items
  }

  if (composition === 'offset') {
    const rows = Math.ceil(count / 2)
    const rowHeight = (height - gap * (rows - 1)) / rows
    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / 2)
      const pairStart = row * 2
      const pairCount = Math.min(2, count - pairStart)
      const leftWidth = (width - gap) * (row % 2 === 0 ? 0.62 : 0.38)
      const cellWidth = pairCount === 1
        ? width
        : index % 2 === 0
          ? leftWidth
          : width - leftWidth - gap
      const cellX = pairCount === 1 || index % 2 === 0
        ? x
        : x + leftWidth + gap
      return {
        index,
        x: cellX,
        y: y + row * (rowHeight + gap),
        width: cellWidth,
        height: rowHeight,
      }
    })
  }

  const columns = count <= 2 ? 2 : count <= 5 ? 2 : 3
  return cellGrid(Array.from({ length: count }, (_, index) => index), {
    x, y, width, height,
  }, columns)
}

function drawGallery(ctx, photos, area, composition, style) {
  const placements = makePhotoRects(area, photos.length, composition)

  placements.forEach(({ index, x, y, width, height, shape = 'rect', rotation: placementRotation }) => {
    const { image } = photos[index]
    const rotation = placementRotation ?? (style === 'polaroid' || style === 'scrapbook' || style === 'instant'
      ? (index % 2 === 0 ? -2.2 : 2.2)
      : style === 'scattered' ? (index % 2 === 0 ? -1.4 : 1.4) : 0)

    ctx.save()
    if (rotation) {
      ctx.translate(x + width / 2, y + height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-x - width / 2, -y - height / 2)
    }

    if (style === 'polaroid' || style === 'scattered' || style === 'scrapbook' || style === 'instant') {
      const pad = style === 'instant'
        ? Math.max(12, Math.min(25, width * 0.055))
        : Math.max(9, Math.min(20, width * 0.045))
      const footer = style === 'instant'
        ? Math.max(28, Math.min(64, height * 0.18))
        : Math.max(15, Math.min(42, height * 0.12))
      ctx.shadowColor = 'rgba(37, 32, 25, 0.2)'
      ctx.shadowBlur = style === 'instant' ? 23 : 15
      ctx.shadowOffsetY = style === 'instant' ? 10 : 6
      ctx.fillStyle = '#fffdf8'
      if (style === 'instant' || style === 'polaroid' || style === 'scrapbook') {
        ctx.fillRect(x, y, width, height)
      } else if (shape === 'circle') {
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, width, height)
      }
      ctx.shadowColor = 'transparent'
      drawCover(
        ctx,
        image,
        x + pad,
        y + pad,
        width - pad * 2,
        height - pad * 2 - footer,
        shape === 'circle' ? 'circle' : shape === 'arch' ? 'arch' : 2,
      )
      ctx.fillStyle = style === 'instant' ? '#625a4c' : '#8c8174'
      ctx.font = `${style === 'instant' ? 700 : 600} ${Math.max(10, Math.min(style === 'instant' ? 22 : 18, width * 0.045))}px Arial, sans-serif`
      ctx.fillText(
        style === 'instant'
          ? ['GOOD DAYS', 'LITTLE JOYS', 'JUST BECAUSE', 'SWEET MOMENT'][index % 4]
          : `MOMENT  ${String(index + 1).padStart(2, '0')}`,
        x + pad,
        y + height - pad,
      )
      if (style === 'scrapbook' || (style === 'scattered' && index % 2 === 0)) {
        drawTape(
          ctx,
          x + width * (index % 2 === 0 ? 0.34 : 0.68),
          y + 1,
          Math.min(164, width * 0.34),
          index % 2 === 0 ? 'rgba(245, 218, 139, 0.92)' : 'rgba(246, 245, 225, 0.88)',
          index % 2 === 0 ? -0.09 : 0.07,
        )
      }
    } else {
      const radius = style === 'soft' ? Math.min(16, width * 0.035) : 2
      if (style === 'framed') {
        ctx.fillStyle = '#fffdf8'
        ctx.fillRect(x - 8, y - 8, width + 16, height + 16)
      }
      if (style === 'cutout' && shape === 'circle') {
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2, width / 2 + 13, height / 2 + 13, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#fffdf8'
        ctx.fill()
      }
      if (style === 'cutout') {
        ctx.fillStyle = '#fffdf8'
        if (shape === 'circle') {
          ctx.beginPath()
          ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
        } else if (shape === 'arch') {
          ctx.beginPath()
          ctx.moveTo(x, y + height)
          ctx.lineTo(x, y + width / 2)
          ctx.arc(x + width / 2, y + width / 2, width / 2, Math.PI, 0)
          ctx.lineTo(x + width, y + height)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.fillRect(x, y, width, height)
        }
      }
      if (style === 'film') {
        ctx.fillStyle = '#242321'
        const filmBorder = Math.max(13, Math.min(27, width * 0.07))
        ctx.fillRect(x - filmBorder, y - filmBorder, width + filmBorder * 2, height + filmBorder * 2)
        ctx.fillStyle = '#f1ebdf'
        if (shape === 'circle') {
          ctx.beginPath()
          ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(x, y, width, height)
        }
        ctx.fillStyle = '#f3eee3'
        for (let hole = 0; hole < 4; hole += 1) {
          const holeY = y + height * (hole + 0.5) / 4 - filmBorder * 0.23
          const holeSize = filmBorder * 0.42
          ctx.fillRect(x - filmBorder * 0.75, holeY, holeSize, filmBorder * 0.46)
          ctx.fillRect(x + width + filmBorder * 0.3, holeY, holeSize, filmBorder * 0.46)
        }
      }
      drawCover(ctx, image, x, y, width, height, shape === 'circle' ? 'circle' : shape === 'arch' ? 'arch' : radius)
      if (style === 'cutout' && shape === 'circle') {
        ctx.beginPath()
        ctx.ellipse(x + width / 2, y + height / 2, width / 2 + 13, height / 2 + 13, 0, 0, Math.PI * 2)
        ctx.strokeStyle = '#fffdf8'
        ctx.lineWidth = 7
        ctx.stroke()
      }
      if (style === 'outlined') {
        ctx.strokeStyle = 'rgba(255, 253, 248, 0.8)'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, width, height)
      }
    }
    ctx.restore()
  })
}

function drawLayout(canvas, photos, layoutIndex) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width: w, height: h } = STORY
  const count = photos.length
  const photoCount = String(count).padStart(2, '0')
  const label = (text, x, y, size = 24, color = '#27231f', weight = 500, font = 'Arial, sans-serif') => {
    ctx.fillStyle = color
    ctx.font = `${weight} ${size}px ${font}`
    ctx.fillText(text, x, y)
  }
  const line = (x1, y1, x2, y2, color, width = 2) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  const gallery = (area, composition, style = 'soft', gap = 18, selection = photos) => {
    drawGallery(ctx, selection, { ...area, gap }, composition, style)
  }

  canvas.width = w
  canvas.height = h
  ctx.clearRect(0, 0, w, h)
  ctx.textBaseline = 'alphabetic'

  switch (layoutIndex) {
    case 0: {
      ctx.fillStyle = '#f4f0e7'
      ctx.fillRect(0, 0, w, h)
      drawPaperGrain(ctx, w, h, 'rgba(91, 73, 52, 0.045)')
      label('camera roll / lately', 72, 128, 22, '#756d60', 700)
      drawTape(ctx, 540, 181, 186, 'rgba(231, 211, 166, 0.92)', 0.035)
      gallery({ x: 84, y: 244, width: 912, height: 1420 }, 'mosaic-flow', 'instant', 26)
      drawDoodle(ctx, 944, 1728, 27, '#aa8876')
      label('kept in my camera roll ♡', 76, 1770, 48, '#26231f', 400, 'Georgia, serif')
      label(`${photoCount} MOMENTS · NO. 01`, 80, 1832, 19, '#817665', 700)
      break
    }
    case 1: {
      drawPhotoBackdrop(ctx, photos[0].image, w, h, 'rgba(25, 24, 30, 0.62)')
      ctx.fillStyle = 'rgba(18, 18, 20, 0.55)'
      ctx.fillRect(0, 0, w, h)
      label('AFTER HOURS  ·  35MM', 76, 142, 22, '#f5ead2', 700)
      label('flash on, world off', 70, 222, 49, '#fff8ec', 400, 'Georgia, serif')
      ctx.save()
      ctx.translate(540, 1000)
      ctx.rotate(-0.055)
      ctx.shadowColor = 'rgba(0,0,0,0.42)'
      ctx.shadowBlur = 42
      ctx.shadowOffsetY = 20
      ctx.fillStyle = '#202022'
      ctx.fillRect(-446, -690, 892, 1380)
      ctx.restore()
      for (let hole = 0; hole < 13; hole += 1) {
        const holeY = 350 + hole * 101
        ctx.fillStyle = '#f2e8d2'
        ctx.beginPath()
        ctx.roundRect(112, holeY, 26, 39, 6)
        ctx.roundRect(942, holeY, 26, 39, 6)
        ctx.fill()
      }
      gallery({ x: 164, y: 342, width: 752, height: 1312 }, 'film-roll', 'film', 24)
      drawTape(ctx, 537, 296, 214, 'rgba(242, 218, 158, 0.93)', -0.035)
      label(`${photoCount} FRAMES FROM THE NIGHT`, 78, 1757, 20, '#e2d6bd', 700)
      label('somewhere between then & now', 72, 1825, 42, '#fff8ec', 400, 'Georgia, serif')
      break
    }
    case 2: {
      drawGingham(ctx, w, h, '#f2d8d2', 'rgba(255, 249, 238, 0.24)', 126)
      drawPaperGrain(ctx, w, h, 'rgba(121, 76, 69, 0.045)')
      ctx.fillStyle = '#e9c7be'
      ctx.beginPath()
      ctx.arc(968, 348, 176, 0, Math.PI * 2)
      ctx.fill()
      gallery({ x: 80, y: 238, width: 920, height: 1304 }, 'flow', 'scrapbook', 24)
      drawSparkle(ctx, 954, 1584, 27, '#fff4df')
      drawSparkle(ctx, 118, 1588, 15, '#cc988f')
      drawDoodle(ctx, 932, 1720, 20, '#bc8f83')
      label('photo dump / no context', 78, 1660, 49, '#543d38', 400, 'Georgia, serif')
      label(`${photoCount} SLIDES FROM MY CAMERA ROLL`, 80, 1744, 19, '#886e65', 700)
      label('♡  main character moments only', 80, 1793, 23, '#886e65', 400, 'Georgia, serif')
      break
    }
    case 3: {
      ctx.fillStyle = '#dce4d5'
      ctx.fillRect(0, 0, w, h)
      drawPaperGrain(ctx, w, h, 'rgba(38, 68, 56, 0.05)')
      ctx.fillStyle = '#264438'
      ctx.fillRect(0, 0, w, 340)
      label('main character energy', 76, 122, 23, '#d9e1d4', 700)
      label('the plot was good.', 70, 258, 70, '#f3f0e6', 400, 'Georgia, serif')
      ctx.fillStyle = '#f8f5ec'
      ctx.fillRect(56, 310, 968, 1260)
      gallery({ x: 84, y: 338, width: 912, height: 1204 }, 'feature-left', 'framed', 24)
      ctx.strokeStyle = '#758b78'
      ctx.lineWidth = 2
      ctx.strokeRect(44, 296, 992, 1288)
      ctx.fillStyle = '#c8a46f'
      ctx.beginPath()
      ctx.arc(962, 1560, 13, 0, Math.PI * 2)
      ctx.fill()
      label('THE RECAP', 76, 1660, 24, '#466454', 700)
      label('worth the camera roll.', 74, 1735, 46, '#264438', 400, 'Georgia, serif')
      line(76, 1780, 1004, 1780, '#9aab98')
      label(`${photoCount} PHOTOS · A VISUAL DIARY`, 76, 1830, 20, '#466454', 700)
      break
    }
    case 4: {
      drawPhotoBackdrop(ctx, photos[0].image, w, h, 'rgba(34, 29, 27, 0.28)')
      ctx.save()
      ctx.shadowColor = 'rgba(20, 18, 16, 0.24)'
      ctx.shadowBlur = 32
      ctx.shadowOffsetY = 16
      ctx.fillStyle = '#f6f0e3'
      ctx.fillRect(48, 194, 984, 1380)
      ctx.restore()
      drawPaperGrain(ctx, w, h, 'rgba(76, 61, 48, 0.035)')
      label('A LITTLE PHOTO DIARY', 92, 274, 22, '#766c5d', 700)
      label('LIFE LATELY', 92, 328, 42, '#302d28', 400, 'Georgia, serif')
      line(92, 356, 988, 356, '#d4cabc')
      gallery(
        { x: 94, y: 392, width: 892, height: 1014 },
        count <= 2 ? 'feature-top' : count <= 4 ? 'feature-left' : 'masonry',
        'instant',
        18,
      )
      label('the moments in between.', 70, 1690, 52, '#fffaf0', 400, 'Georgia, serif')
      label(`${photoCount} PHOTOS  ·  POST-IN AJA`, 76, 1774, 20, '#f0e7d7', 700)
      line(76, 1810, 1004, 1810, 'rgba(255,255,255,0.45)')
      label('STORY NO. 01', 76, 1855, 18, '#f0e7d7', 600)
      break
    }
    case 5: {
      drawPhotoBackdrop(ctx, photos[0].image, w, h, 'rgba(229, 207, 174, 0.32)')
      ctx.fillStyle = 'rgba(246, 239, 224, 0.78)'
      ctx.fillRect(0, 0, w, h)
      drawPaperGrain(ctx, w, h, 'rgba(87, 71, 40, 0.055)')
      label('the weekend edit', 74, 145, 23, '#766b50', 700)
      label('little things, lately', 72, 235, 59, '#3b382e', 400, 'Georgia, serif')
      gallery({ x: 68, y: 292, width: 944, height: 1282 }, 'circles', 'cutout', 23)
      drawSparkle(ctx, 890, 240, 35, '#cb765f')
      drawDoodle(ctx, 939, 1665, 20, '#bb806d')
      label('wish we could rewind', 76, 1665, 45, '#514536', 400, 'Georgia, serif')
      label(`${photoCount} SNAPSHOTS · KEEP FOREVER`, 79, 1740, 21, '#827456', 700)
      line(76, 1780, 1004, 1780, '#cfc4a8')
      label('SAVED TO CAMERA ROLL ♡', 78, 1830, 20, '#827456', 700)
      break
    }
    case 6: {
      ctx.fillStyle = '#e8e1f0'
      ctx.fillRect(0, 0, w, h)
      drawPaperGrain(ctx, w, h, 'rgba(54, 41, 68, 0.055)')
      drawPhotoBackdrop(ctx, photos[0].image, w, h, 'rgba(72, 53, 81, 0.48)')
      ctx.fillStyle = 'rgba(232, 225, 240, 0.36)'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#3c3152'
      ctx.fillRect(0, 1510, w, 410)
      label('camera roll, but make it a moodboard', 78, 142, 21, '#594a6c', 700)
      label('the lore is getting good', 72, 250, 56, '#3c3152', 400, 'Georgia, serif')
      gallery({ x: 66, y: 320, width: 948, height: 1120 }, 'overlap', 'polaroid', 25)
      drawTape(ctx, 520, 314, 150, 'rgba(246, 220, 147, 0.95)', -0.04)
      drawSparkle(ctx, 946, 1474, 31, '#e6b6a3')
      drawDoodle(ctx, 135, 1477, 23, '#fff8e8')
      label('the lore goes crazy.', 70, 1640, 55, '#faf8f3', 400, 'Georgia, serif')
      label(`${photoCount} PHOTOS · NO SKIPS`, 76, 1810, 20, '#d1c8dc', 700)
      break
    }
    case 7: {
      drawGingham(ctx, w, h, '#e7e3d9', 'rgba(143, 132, 111, 0.08)', 82)
      drawPaperGrain(ctx, w, h, 'rgba(75, 68, 56, 0.045)')
      label('ROLL 01 · NO SKIPS', 76, 144, 22, '#736b5f', 700)
      label('proof we had fun', 72, 234, 62, '#2b2a27', 400, 'Georgia, serif')
      ctx.fillStyle = '#242321'
      ctx.fillRect(26, 290, 1028, 1288)
      gallery({ x: 72, y: 326, width: 936, height: 1214 }, 'film-roll', 'film', 23)
      drawSparkle(ctx, 972, 1612, 24, '#b47a61')
      label('proof of a good day.', 76, 1660, 50, '#736b5f', 400, 'Georgia, serif')
      label(`CONTACT SHEET  ·  ${photoCount} FRAMES`, 76, 1750, 20, '#736b5f', 700)
      label('unfiltered & unserious', 76, 1810, 23, '#736b5f', 400, 'Georgia, serif')
      break
    }
    case 8: {
      ctx.fillStyle = '#e5eeeb'
      ctx.fillRect(0, 0, w, h)
      drawPaperGrain(ctx, w, h, 'rgba(49, 86, 72, 0.05)')
      ctx.fillStyle = '#f8f7f0'
      ctx.beginPath()
      ctx.roundRect(46, 68, 988, 1784, 38)
      ctx.fill()
      label('NOTES FROM TODAY', 88, 160, 22, '#6c827b', 700)
      line(88, 194, 992, 194, '#d2dfda')
      for (let y = 230; y < 1570; y += 48) line(88, y, 992, y, '#e3eae5')
      gallery({ x: 104, y: 252, width: 872, height: 1280 }, 'mosaic-flow', 'soft', 25)
      drawTape(ctx, 810, 237, 132, 'rgba(235, 221, 157, 0.9)', 0.08)
      drawSparkle(ctx, 926, 1570, 25, '#deb7a3')
      label('brb, romanticizing life.', 92, 1650, 43, '#34584c', 400, 'Georgia, serif')
      label(`${photoCount} PHOTOS  ·  JUST A LITTLE RECAP`, 94, 1750, 19, '#6c827b', 700)
      label('saved from the camera roll', 94, 1810, 22, '#6c827b', 400, 'Georgia, serif')
      break
    }
    default: {
      drawGingham(ctx, w, h, '#edf0e6', 'rgba(68, 92, 67, 0.12)', 76)
      drawPaperGrain(ctx, w, h, 'rgba(51, 62, 46, 0.04)')
      ctx.fillStyle = '#fffdf7'
      ctx.fillRect(54, 64, 972, 1792)
      label('POSTCARDS FROM', 92, 148, 22, '#777b67', 700)
      label('our little world', 82, 232, 62, '#303d32', 400, 'Georgia, serif')
      gallery({ x: 96, y: 286, width: 888, height: 1268 }, 'flow', 'scrapbook', 22)
      drawTape(ctx, 539, 275, 174, 'rgba(235, 219, 159, 0.94)', -0.03)
      ctx.strokeStyle = '#c7cebd'
      ctx.lineWidth = 2
      ctx.strokeRect(78, 262, 924, 1318)
      label('A PHOTO ESSAY', 92, 1690, 22, '#777b67', 700)
      label('all the little things.', 88, 1763, 49, '#303d32', 400, 'Georgia, serif')
      label(`${photoCount} PHOTOS  ·  POST-IN AJA`, 94, 1820, 19, '#777b67', 700)
      break
    }
  }
}

export default function App() {
  const [photos, setPhotos] = useState([])
  const [activeLayout, setActiveLayout] = useState(0)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const ownedUrls = useRef(new Set())

  useEffect(() => {
    const urls = ownedUrls.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    if (photos.length && canvasRef.current) {
      drawLayout(canvasRef.current, photos, activeLayout)
    }
  }, [photos, activeLayout])

  const handleFiles = async (files) => {
    if (!files.length) return
    const allFiles = Array.from(files)
    const remaining = 10 - photos.length
    if (remaining <= 0) {
      setError('Maksimal 10 foto. Hapus foto yang ada untuk menggantinya.')
      return
    }

    setError('')
    setIsLoading(true)
    const selectedFiles = allFiles.slice(0, remaining)
    const results = await Promise.allSettled(selectedFiles.map(loadImage))
    const loaded = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)
    const failed = results.find((result) => result.status === 'rejected')

    loaded.forEach(({ url }) => ownedUrls.current.add(url))
    if (loaded.length) setPhotos((current) => [...current, ...loaded])
    if (failed) setError(failed.reason.message)
    if (allFiles.length > remaining) {
      setError(`Maksimal 10 foto. ${remaining} foto pertama sudah ditambahkan.`)
    }
    if (!loaded.length && !failed) {
      setError('Pilih file foto dengan format gambar yang didukung.')
    }
    setIsLoading(false)
  }

  const removePhoto = (index) => {
    const removed = photos[index]
    if (!removed) return
    URL.revokeObjectURL(removed.url)
    ownedUrls.current.delete(removed.url)
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))
    setError('')
  }

  const download = () => {
    if (!canvasRef.current || !photos.length) return

    const link = document.createElement('a')
    const layoutNumber = String(activeLayout + 1).padStart(2, '0')
    link.download = `post-in-aja-${photos.length}-foto-layout-${layoutNumber}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Post-in aja beranda">
          <span className="brand-mark">p.</span>
          <span>post-in aja</span>
        </a>
        <div className="topbar-note">
          <span className="status-dot" />
          studio layout story
        </div>
      </header>

      <section className="intro">
        <div className="intro-copy">
          <p className="eyebrow">YOUR PHOTOS, ONE BEAUTIFUL STORY</p>
          <h1>Biar fotonya yang <em>cerita.</em></h1>
          <p className="intro-description">
            Upload sampai 10 foto. Pilih layout yang pas dengan jumlah foto,
            lalu unduh untuk Story Instagram, TikTok, atau WhatsApp.
          </p>
        </div>
        <div className="intro-count">
          <span>10</span>
          <small>LAYOUT<br />UNTUK CERITAMU</small>
        </div>
      </section>

      <section className="studio">
        <aside className="controls">
          <div className="section-heading">
            <span className="step-number">01</span>
            <div>
              <h2>Kumpulkan foto</h2>
              <p>Pilih sampai 10 foto · {photos.length}/10 dipilih</p>
            </div>
          </div>

          <input
            ref={inputRef}
            className="file-input"
            type="file"
            accept="image/*"
            multiple
            disabled={isLoading || photos.length === 10}
            onChange={(event) => {
              if (event.target.files) handleFiles(event.target.files)
              event.target.value = ''
            }}
            aria-label="Pilih foto"
          />

          {photos.length === 0 ? (
            <button
              className="upload-card"
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
            >
              <span className="upload-icon" aria-hidden="true">＋</span>
              <strong>{isLoading ? 'Lagi menyiapkan foto...' : 'Pilih foto dari perangkat'}</strong>
              <span>JPG, PNG, atau WEBP · Maks. 10 foto</span>
            </button>
          ) : (
            <div className="photo-list">
              {photos.map((photo, index) => (
                <div className="photo-chip" key={photo.url}>
                  <img src={photo.url} alt={photo.name} title={photo.name} />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <button
                    className="remove-photo"
                    type="button"
                    onClick={() => removePhoto(index)}
                    aria-label={`Hapus foto ${index + 1}: ${photo.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 10 && (
                <button
                  className="add-photo"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  aria-label="Tambah foto"
                  disabled={isLoading}
                >
                  +
                </button>
              )}
            </div>
          )}

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="divider" />
          <div className="section-heading layout-heading">
            <span className="step-number">02</span>
            <div>
              <h2>Pilih suasananya</h2>
              <p>
                {photos.length
                  ? `${photos.length} foto · komposisi menyesuaikan otomatis`
                  : 'Layout akan mengikuti jumlah fotomu'}
              </p>
            </div>
          </div>
          <div className="layout-list">
            {LAYOUTS.map((layout, index) => (
              <button
                className={`layout-option ${activeLayout === index ? 'is-active' : ''}`}
                key={layout.name}
                type="button"
                onClick={() => setActiveLayout(index)}
                aria-pressed={activeLayout === index}
              >
                <span className="layout-swatch" style={{ background: layout.color }}>
                  <span />
                </span>
                <span className="layout-copy">
                  <strong>{layout.name}</strong>
                  <small>{layout.detail}</small>
                </span>
                <span className="layout-index">{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="preview-panel" aria-label="Pratinjau layout">
          <div className="preview-topline">
            <div>
              <span className="preview-label">LIVE PREVIEW</span>
              <h2>{photos.length ? `${photos.length} foto · ${LAYOUTS[activeLayout].name}` : 'Ruang ceritamu'}</h2>
            </div>
            <span className="format-badge">STORY · 9:16</span>
          </div>

          <div className={`canvas-stage ${photos.length ? '' : 'is-empty'}`}>
            {photos.length > 0 ? (
              <canvas
                ref={canvasRef}
                className="story-canvas"
                aria-label={`Pratinjau ${LAYOUTS[activeLayout].name} untuk ${photos.length} foto`}
              />
            ) : (
              <div className="empty-preview">
                <span className="empty-sparkle">✳</span>
                <p>Pratinjau layout<br />akan muncul di sini</p>
              </div>
            )}
          </div>

          <div className="preview-footer">
            <div className="preview-pagination">
              <span>{photos.length ? String(activeLayout + 1).padStart(2, '0') : '—'}</span>
              <span className="pagination-line" />
              <span>10</span>
              <small>VARIASI</small>
            </div>
            <button
              className="download-button"
              type="button"
              onClick={download}
              disabled={photos.length === 0 || isLoading}
            >
              <span>Unduh desain</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
          <p className="privacy-note">Foto diproses di perangkatmu dan tidak diunggah ke server.</p>
        </section>
      </section>
      <footer className="page-footer">Dibuat untuk cerita-cerita kecil yang layak dibagikan. <span>✳</span></footer>
    </main>
  )
}
