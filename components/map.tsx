'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RouteData {
  from: [number, number]
  to: [number, number]
  color?: string
  label?: string
}

interface MapComponentProps {
  center?: [number, number]
  zoom?: number
  markers?: Array<{
    position: [number, number]
    popup?: string
    type?: 'incident' | 'responder' | 'user-live'
  }>
  routes?: RouteData[]
  className?: string
  light?: boolean
  fitBounds?: boolean
  selectedIncident?: [number, number] | null
}

export function MapComponent({ 
  center = [28.6139, 77.2090],
  zoom = 13,
  markers = [],
  routes = [],
  className = '',
  light = true,
  fitBounds = true,
  selectedIncident,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, zoom)

    const tileUrl = light
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current)

    // Fix map rendering in flex containers
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 100)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Handle resize / visibility changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize()
    })
    if (mapRef.current) observer.observe(mapRef.current)
    return () => observer.disconnect()
  }, [])

  // Draw markers and routes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current

    // Clear existing markers and overlays (keep tile layer)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    // --- Markers ---
    markers.forEach(({ position, popup, type }) => {
      let html = ''

      if (type === 'user-live') {
        html = `
          <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.18);animation:livePulse 2s ease-out infinite;"></div>
            <div style="position:absolute;inset:4px;border-radius:50%;background:rgba(239,68,68,0.12);animation:livePulse 2s ease-out infinite;animation-delay:0.5s;"></div>
            <div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.5);position:relative;z-index:2;"></div>
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
        // Responder marker — green with ambulance/shield icon
        html = `
          <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(34,197,94,0.12);animation:livePulse 3s ease-out infinite;"></div>
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(34,197,94,0.4);background:linear-gradient(135deg,#22c55e,#16a34a);border:2px solid white;">R</div>
          </div>
        `
      }

      const icon = L.divIcon({
        className: 'custom-marker',
        html,
        iconSize: type === 'user-live' ? [40, 40] : [36, 36],
        iconAnchor: type === 'user-live' ? [20, 20] : [18, 18],
      })

      const marker = L.marker(position, { icon }).addTo(map)
      if (popup) marker.bindPopup(popup, {
        className: 'custom-popup',
        maxWidth: 220,
      })
    })

    // --- Routes (polylines from responder to incident) ---
    routes.forEach(({ from, to, color = '#6366f1', label }) => {
      // Skip routes where from and to are the same or very close (< ~500m), or unrealistically far (> ~50km)
      const distLat = Math.abs(from[0] - to[0])
      const distLng = Math.abs(from[1] - to[1])
      if ((distLat < 0.004 && distLng < 0.004) || distLat > 0.5 || distLng > 0.5) return

      // Animated dashed line
      const polyline = L.polyline([from, to], {
        color,
        weight: 3,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map)

      // Add a midpoint label if provided
      if (label) {
        const midLat = (from[0] + to[0]) / 2
        const midLng = (from[1] + to[1]) / 2
        const labelIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:${color};color:#fff;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.15);border:2px solid white;">${label}</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        })
        L.marker([midLat, midLng], { icon: labelIcon, interactive: false }).addTo(map)
      }

      // Small direction arrow at the midpoint
      const midLat = (from[0] + to[0]) / 2
      const midLng = (from[1] + to[1]) / 2
      const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * (180 / Math.PI)
      const arrowIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="transform:rotate(${-angle + 90}deg);color:${color};font-size:16px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,0.15);">▲</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      if (!label) {
        L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(map)
      }
    })

    // --- Auto-fit bounds ---
    if (fitBounds && markers.length > 0) {
      const allPoints: [number, number][] = markers.map(m => m.position)
      // Include route endpoints only for visible routes (not skipped ones)
      routes.forEach(r => {
        const distLat = Math.abs(r.from[0] - r.to[0])
        const distLng = Math.abs(r.from[1] - r.to[1])
        if ((distLat >= 0.004 || distLng >= 0.004) && distLat <= 0.5 && distLng <= 0.5) {
          allPoints.push(r.from, r.to)
        }
      })

      if (allPoints.length >= 2) {
        const bounds = L.latLngBounds(allPoints.map(p => L.latLng(p[0], p[1])))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: true })
      } else if (selectedIncident) {
        map.setView(selectedIncident, 14, { animate: true })
      } else if (allPoints.length === 1) {
        map.setView(allPoints[0], 14, { animate: true })
      }
    }
  }, [markers, routes, selectedIncident, fitBounds, zoom])

  // Center change when not fitting bounds
  useEffect(() => {
    if (mapInstanceRef.current && !fitBounds) {
      mapInstanceRef.current.setView(center, zoom)
    }
  }, [center, zoom, fitBounds])

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
