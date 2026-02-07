'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapComponentProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    popup?: string
    type?: 'incident' | 'responder' | 'user-live'
  }>
  className?: string
  light?: boolean
}

export function MapComponent({ 
  center = [28.6139, 77.2090],
  zoom = 13,
  markers = [],
  className = '',
  light = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom)

    const tileUrl = light
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })

    markers.forEach(({ position, popup, type }) => {
      let html = ''

      if (type === 'user-live') {
        html = `
          <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.2);animation:livePulse 2s ease-out infinite;"></div>
            <div style="position:absolute;inset:4px;border-radius:50%;background:rgba(59,130,246,0.15);animation:livePulse 2s ease-out infinite;animation-delay:0.5s;"></div>
            <div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.5);position:relative;z-index:2;"></div>
          </div>
        `
      } else if (type === 'incident') {
        html = `
          <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.15);animation:livePulse 3s ease-out infinite;"></div>
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(239,68,68,0.4);background:linear-gradient(135deg,#ef4444,#dc2626);">!</div>
          </div>
        `
      } else {
        html = `
          <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;box-shadow:0 2px 10px rgba(34,197,94,0.3);background:linear-gradient(135deg,#22c55e,#16a34a);border:2px solid white;">R</div>
        `
      }

      const icon = L.divIcon({
        className: 'custom-marker',
        html,
        iconSize: type === 'user-live' ? [40, 40] : [36, 36],
        iconAnchor: type === 'user-live' ? [20, 20] : [18, 18],
      })

      const marker = L.marker(position, { icon }).addTo(mapInstanceRef.current!)
      if (popup) marker.bindPopup(popup)
    })
  }, [markers])

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full overflow-hidden ${className}`}
      style={{ zIndex: 0, minHeight: '200px' }}
    />
  )
}

export function Map(props: MapComponentProps) {
  return <MapComponent {...props} />
}
