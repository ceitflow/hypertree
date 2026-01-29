import { useRef } from 'react';

export const TreeMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={mapRef}>
      Map works
    </div>
  )
}
