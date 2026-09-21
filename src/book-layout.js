/* Shared paper geometry. Dimensions are centimetres, independent of screen zoom. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MindSetBookLayout = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const PX_PER_CM = 96 / 2.54;
  const formats = [
    { id: 'a4', label: 'A4', widthCm: 21, heightCm: 29.7 },
    { id: 'a5', label: 'A5', widthCm: 14.8, heightCm: 21 },
    { id: 'a6', label: 'A6', widthCm: 10.5, heightCm: 14.8 },
    { id: 'a3', label: 'A3', widthCm: 29.7, heightCm: 42 },
    { id: 'letter', label: 'Letter US', widthCm: 21.59, heightCm: 27.94 },
    { id: 'legal', label: 'Legal US', widthCm: 21.59, heightCm: 35.56 },
    { id: 'executive', label: 'Executive', widthCm: 18.41, heightCm: 26.67 },
    { id: 'pocket', label: 'Poche', widthCm: 11, heightCm: 18 },
  ];
  function bounded(value, fallback, min, max) {
    const number = (typeof value === "number" || (typeof value === "string" && value.trim())) ? Number(value) : NaN;
    return Math.round(Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback)) * 100) / 100;
  }
  function dimensions(value = {}) {
    const format = formats.find(item => item.id === value.sizeId) || formats[0];
    let widthCm = value.sizeId === 'custom' ? bounded(value.customWidthCm, 21, 8, 60) : format.widthCm;
    let heightCm = value.sizeId === 'custom' ? bounded(value.customHeightCm, 29.7, 8, 60) : format.heightCm;
    if (value.orientation === 'landscape') [widthCm, heightCm] = [heightCm, widthCm];
    return { widthCm, heightCm };
  }
  function normalize(value = {}) {
    value = value && typeof value === 'object' ? value : {};
    const setup = {
      sizeId: value.sizeId === 'custom' || formats.some(format => format.id === value.sizeId) ? value.sizeId : 'a4',
      orientation: value.orientation === 'landscape' ? 'landscape' : 'portrait',
      customWidthCm: bounded(value.customWidthCm, 21, 8, 60),
      customHeightCm: bounded(value.customHeightCm, 29.7, 8, 60),
      margins: {},
    };
    const size = dimensions(setup);
    for (const [first, second, dimension] of [['left', 'right', size.widthCm], ['top', 'bottom', size.heightCm]]) {
      let a = bounded(value.margins?.[first], 2, 0.1, dimension - 4.1);
      let b = bounded(value.margins?.[second], 2, 0.1, dimension - 4.1);
      if (a + b > dimension - 4) { const factor = (dimension - 4) / (a + b); a *= factor; b *= factor; }
      setup.margins[first] = Math.round(a * 100) / 100;
      setup.margins[second] = Math.round(b * 100) / 100;
    }
    return setup;
  }
  function geometry(value, columns = 2) {
    const setup = normalize(value), size = dimensions(setup);
    const count = Math.min(4, Math.max(1, Math.round(Number(columns) || 2)));
    const width = size.widthCm * PX_PER_CM, height = size.heightCm * PX_PER_CM;
    const margins = Object.fromEntries(Object.entries(setup.margins).map(([key, value]) => [key, value * PX_PER_CM]));
    const gap = 28;
    return { ...size, setup, columns: count, width, height, margins, gap,
      contentWidth: width - margins.left - margins.right,
      contentHeight: height - margins.top - margins.bottom,
      columnGap: margins.left + margins.right + gap,
      rowGap: margins.top + margins.bottom + gap,
      canvasWidth: count * width + (count - 1) * gap,
    };
  }
  return { formats, normalize, dimensions, geometry, PX_PER_CM };
});
