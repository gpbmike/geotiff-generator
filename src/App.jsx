import { writeArrayBuffer } from "geotiff";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const geotiff = useGeoTIFF();

  return (
    <div>
      <h1>GeoTIFF Generator</h1>
      <p>Generate a 4x4 geotiff with a NODATA hole in the middle.</p>
      <div>
        <a download="geotiff.tiff" href={geotiff}>
          Download geoTIFF
        </a>
      </div>
    </div>
  );
}

export default App;

function useGeoTIFF() {
  const [geotiff, setGeotiff] = useState();

  const nanHole = true;

  useEffect(() => {
    const width = 4;
    const height = 4;
    const GDAL_NODATA = "50";

    const raster = new Float32Array(height * width);

    const quarterWidth = width / 4;
    const quarterHeight = height / 4;

    for (let y = 0; y < height; y += 1) {
      const isMiddleY = y >= quarterHeight && y < height - quarterHeight;

      for (let x = 0; x < width; x += 1) {
        const isMiddleX = x >= quarterWidth && x < width - quarterWidth;

        if (isMiddleY && isMiddleX && nanHole) {
          raster[y * width + x] = GDAL_NODATA;
        } else if (x < width / 2 && y < height / 2) {
          raster[y * width + x] = 0;
        } else if (x >= width / 2 && y >= height / 2) {
          raster[y * width + x] = 0;
        } else {
          raster[y * width + x] = 100;
        }
      }
    }

    // earthquakes stadium
    const polygon = [
      [-121.92531581619407, 37.350869597268186],
      [-121.92462140024443, 37.35052661728896],
      [-121.923891128915, 37.35145270482593],
      [-121.9245792970085, 37.35179876528599],
      [-121.92531581619407, 37.350869597268186],
    ];

    const extent = polygon.reduce(
      ({ xmin, xmax, ymin, ymax }, [longitude, latitude]) => ({
        xmin: Math.min(xmin, longitude),
        xmax: Math.max(xmax, longitude),
        ymin: Math.min(ymin, latitude),
        ymax: Math.max(ymax, latitude),
      }),
      { xmin: Infinity, xmax: -Infinity, ymin: Infinity, ymax: -Infinity }
    );

    const ModelTiepoint = [0, 0, 0, extent.xmin, extent.ymax, 0];

    const ModelPixelScale = [
      (extent.xmax - extent.xmin) / width,
      (extent.ymax - extent.ymin) / height,
      0,
    ];

    (async function () {
      const metadata = {
        GDAL_NODATA,
        GeogCitationGeoKey: "WGS 84",
        GeographicTypeGeoKey: 4326,
        GTModelTypeGeoKey: 2,
        height,
        ModelPixelScale,
        ModelTiepoint,
        width,
      };

      const arrayBuffer = await writeArrayBuffer(raster, metadata);
      const blob = new Blob([arrayBuffer], { type: "image/tiff" });
      const objectURL = URL.createObjectURL(blob);
      setGeotiff((prev) => {
        URL.revokeObjectURL(prev);
        return objectURL;
      });
    })();
  }, []);

  return geotiff;
}
