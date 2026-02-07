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
    type?: 'incident' | 'responder'
  }>
  className?: string
}

export function MapComponent({ 
  center = [28.6139, 77.2090], // Default: New Delhi
  zoom = 13,
  markers = [],
  className = ''
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstanceRef.current)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current?.removeLayer(layer)
      }
    })

    // Add new markers
    markers.forEach(({ position, popup, type }) => {
      const bg = type === 'incident' ? '#ef4444' : '#3b82f6'
      const label = type === 'incident' ? '!' : '•'
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.3);background:${bg}">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker(position, { icon }).addTo(mapInstanceRef.current!)
      
      if (popup) {
        marker.bindPopup(popup)
      }
    })
  }, [markers])

  // Update center/zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom)
    }
  }, [center, zoom])

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-full rounded-xl overflow-hidden ${className}`}
      style={{ zIndex: 0, minHeight: '200px' }}
    />
  )
}

// Dynamic import wrapper to avoid SSR issues
export function Map(props: MapComponentProps) {
  return <MapComponent {...props} />
}
