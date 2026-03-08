import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { api } from '../services/api';

const containerStyle = { width: '100%', height: '400px' };
const defaultCenter = { lat: -15.77972, lng: -47.92972 };
const defaultZoom = 6;

export type PoligonoGeoJSON = {
  type: 'Polygon';
  coordinates: number[][][];
};

interface MapaPiqueteProps {
  value?: PoligonoGeoJSON | null;
  onChange: (poligono: PoligonoGeoJSON | null, areaHa?: number) => void;
  disabled?: boolean;
}

function MapaGoogle({ apiKey, value, onChange, disabled }: MapaPiqueteProps & { apiKey: string }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-piquete',
    version: 'weekly',
    language: 'pt-BR',
    region: 'BR',
    libraries: ['drawing', 'geometry'],
  });

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setOptions({ mapTypeId: 'hybrid', mapTypeControl: true });

      if (disabled) return;

      const dm = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [google.maps.drawing.OverlayType.POLYGON],
        },
        polygonOptions: {
          editable: true,
          draggable: true,
          fillColor: '#22c55e',
          fillOpacity: 0.3,
          strokeColor: '#16a34a',
          strokeWeight: 2,
        },
      });

      dm.setMap(map);
      drawingManagerRef.current = dm;

      function extrairGeoJSON() {
        const path = polygonRef.current?.getPath();
        if (!path) return;
        const coords: number[][] = [];
        for (let i = 0; i < path.getLength(); i++) {
          const p = path.getAt(i);
          coords.push([p.lng(), p.lat()]);
        }
        if (coords.length >= 3) {
          if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
            coords.push([...coords[0]]);
          }
          const poligono: PoligonoGeoJSON = { type: 'Polygon', coordinates: [coords] };
          let areaHa: number | undefined;
          if (typeof google?.maps?.geometry?.spherical?.computeArea === 'function') {
            const areaM2 = google.maps.geometry.spherical.computeArea(path);
            areaHa = Math.round(areaM2 / 10000 * 100) / 100; // m² → ha, 2 decimais
          }
          onChangeRef.current(poligono, areaHa);
        }
      }

      google.maps.event.addListener(dm, 'polygoncomplete', (polygon: google.maps.Polygon) => {
        if (polygonRef.current) polygonRef.current.setMap(null);
        polygonRef.current = polygon;
        const path = polygon.getPath();
        const bounds = new google.maps.LatLngBounds();
        for (let i = 0; i < path.getLength(); i++) bounds.extend(path.getAt(i));
        map.fitBounds(bounds, 40);
        extrairGeoJSON();
        path.addListener('set_at', extrairGeoJSON);
        path.addListener('insert_at', extrairGeoJSON);
        path.addListener('remove_at', extrairGeoJSON);
      });

      const ring = value?.coordinates?.[0];
      if (ring && ring.length >= 3) {
        const path = ring.map(([lng, lat]) => ({ lat, lng }));
        const bounds = new google.maps.LatLngBounds();
        path.forEach((pt) => bounds.extend(new google.maps.LatLng(pt.lat, pt.lng)));
        map.fitBounds(bounds, 40);

        const p = new google.maps.Polygon({
          paths: path,
          editable: true,
          draggable: true,
          map,
          fillColor: '#22c55e',
          fillOpacity: 0.3,
          strokeColor: '#16a34a',
          strokeWeight: 2,
        });
        polygonRef.current = p;
        p.getPath().addListener('set_at', extrairGeoJSON);
        p.getPath().addListener('insert_at', extrairGeoJSON);
        p.getPath().addListener('remove_at', extrairGeoJSON);
      }
    },
    [disabled, value]
  );

  useEffect(() => {
    if (loadError) console.error('Google Maps load error:', loadError);
  }, [loadError]);

  const onUnmount = useCallback(() => {
    if (polygonRef.current) polygonRef.current.setMap(null);
    if (drawingManagerRef.current) drawingManagerRef.current.setMap(null);
    mapRef.current = null;
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg text-gray-500">
        Carregando mapa...
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: true,
          mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      />
      <p className="text-xs text-gray-500 mt-1 px-2">
        Use o ícone de polígono para desenhar o perímetro. Clique para adicionar vértices, duplo clique para fechar. A área (ha) é calculada automaticamente ao fechar ou editar o polígono.
      </p>
    </div>
  );
}

export function MapaPiquete({ value, onChange, disabled }: MapaPiqueteProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const envKey = (import.meta as { env?: Record<string, string> }).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    api
      .get<{ googleMapsApiKey: string }>('/config')
      .then((r) => setApiKey(r?.googleMapsApiKey?.trim() || ''))
      .catch(() => setApiKey(''));
  }, []);

  if (apiKey === null) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg text-gray-500">
        Carregando...
      </div>
    );
  }

  const chaveFinal = apiKey || envKey;

  if (disabled) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-lg text-gray-500">
        Mapa desabilitado
      </div>
    );
  }

  if (!chaveFinal) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
        Configure a chave da API do Google Maps em{' '}
        <Link to="/configuracoes" className="text-primary-600 hover:underline font-medium">
          Configurações
        </Link>
        {' '}para habilitar o mapa de perímetro. Obtenha a chave em{' '}
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
          console.cloud.google.com/apis/credentials
        </a>.
      </div>
    );
  }

  return <MapaGoogle apiKey={chaveFinal} value={value} onChange={onChange} disabled={disabled} />;
}
