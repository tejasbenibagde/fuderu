import { useEffect, useRef, useState } from "react";
import Layout from "@theme/Layout";
import {
  Canvas,
  DynamicShapeModule,
  DynamicTransparencyModule,
  SpreadModule,
  type BlendMode,
  type Layer,
} from "fuderu";

import styles from "./editor.module.css";

type Project = {
  id: number;
  name: string;
  width: number;
  height: number;
};

const presets = [
  { label: "Square", width: 1536, height: 1536 },
  { label: "Portrait", width: 1440, height: 1920 },
  { label: "Landscape", width: 1920, height: 1080 },
];

const blendModes: BlendMode[] = [
  "source-over",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
];

export default function EditorPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("Untitled Canvas");
  const [width, setWidth] = useState(1536);
  const [height, setHeight] = useState(1536);

  return (
    <Layout title="Editor" description="Interactive Fuderu editor demo">
      <main className={styles.page}>
        {!project ? (
          <section className={styles.landing}>
            <div className={styles.setup}>
              <img
                className={styles.logo}
                src="/img/fuderu.webp"
                alt="Fuderu"
                width={224}
                height={76}
              />
              <span className={styles.badge}>Fuderu 0.8.8 Editor</span>
              <h1>Create a drawing project</h1>
              <p>
                Start with a document size and build a layered composition. The
                editor highlights the core workflow for brush control and layer
                compositing.
              </p>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="project-name">Project name</label>
                  <input
                    id="project-name"
                    className={styles.input}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>

                <div className={styles.presets}>
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={`${styles.preset} ${
                        width === preset.width && height === preset.height
                          ? styles.presetActive
                          : ""
                      }`}
                      onClick={() => {
                        setWidth(preset.width);
                        setHeight(preset.height);
                      }}
                    >
                      <strong>{preset.label}</strong>
                      <small>
                        {preset.width} x {preset.height}
                      </small>
                    </button>
                  ))}
                </div>

                <div className={styles.sizeGrid}>
                  <div className={styles.field}>
                    <label htmlFor="canvas-width">Width</label>
                    <input
                      id="canvas-width"
                      className={styles.input}
                      min={1}
                      type="number"
                      value={width}
                      onChange={(event) => setWidth(Number(event.target.value))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="canvas-height">Height</label>
                    <input
                      id="canvas-height"
                      className={styles.input}
                      min={1}
                      type="number"
                      value={height}
                      onChange={(event) =>
                        setHeight(Number(event.target.value))
                      }
                    />
                  </div>
                </div>

                <button
                  className={styles.button}
                  type="button"
                  onClick={() =>
                    setProject({
                      id: Date.now(),
                      name: name.trim() || "Untitled Canvas",
                      width: Math.max(1, Math.round(width)),
                      height: Math.max(1, Math.round(height)),
                    })
                  }
                >
                  Create project
                </button>
              </div>
            </div>
            <div className={styles.preview}>
              <div className={styles.previewCanvas} />
            </div>
          </section>
        ) : (
          <Editor project={project} onNewProject={() => setProject(null)} />
        )}
      </main>
    </Layout>
  );
}

function Editor({
  project,
  onNewProject,
}: {
  project: Project;
  onNewProject: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const painterRef = useRef<Canvas | null>(null);
  const shapeModuleRef = useRef<DynamicShapeModule | null>(null);
  const transparencyModuleRef = useRef<DynamicTransparencyModule | null>(null);
  const spreadModuleRef = useRef<SpreadModule | null>(null);

  const [size, setSize] = useState(28);
  const [opacity, setOpacity] = useState(1);
  const [flow, setFlow] = useState(0.9);
  const [spacing, setSpacing] = useState(0.12);
  const [roundness, setRoundness] = useState(0.5);
  const [color, setColor] = useState("#0f766e");
  const [eraser, setEraser] = useState(false);
  const [pressureSimulation, setPressureSimulation] = useState(true);
  const [dynamicShape, setDynamicShape] = useState(false);
  const [sizeJitter, setSizeJitter] = useState(0.35);
  const [angleJitter, setAngleJitter] = useState(0.16);
  const [roundJitter, setRoundJitter] = useState(0.18);
  const [minDiameter, setMinDiameter] = useState(0.35);
  const [minRoundness, setMinRoundness] = useState(0.35);
  const [transparency, setTransparency] = useState(false);
  const [opacityJitter, setOpacityJitter] = useState(0.22);
  const [flowJitter, setFlowJitter] = useState(0.3);
  const [minOpacityJitter, setMinOpacityJitter] = useState(0.45);
  const [minFlowJitter, setMinFlowJitter] = useState(0.3);
  const [spread, setSpread] = useState(false);
  const [spreadRange, setSpreadRange] = useState(0.42);
  const [spreadCount, setSpreadCount] = useState(4);
  const [spreadCountJitter, setSpreadCountJitter] = useState(0.35);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [displaySize, setDisplaySize] = useState({
    width: project.width,
    height: project.height,
  });

  const refreshLayers = () => {
    const painter = painterRef.current;
    if (!painter) return;

    const nextLayers = [...painter.getLayers()];
    setLayers(nextLayers);
    setActiveLayerId(painter.getActiveLayer().id);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const painter = new Canvas({
      canvas,
      document: {
        width: project.width,
        height: project.height,
      },
      brush: {
        color,
        size,
        opacity,
        flow,
        spacing,
        eraser,
        roundness,
      },
      pressureSimulation,
    });

    const shapeModule = new DynamicShapeModule();
    const transparencyModule = new DynamicTransparencyModule();
    const spreadModule = new SpreadModule({ spreadRange: 0 });

    painter.brush.useModule(shapeModule);
    painter.brush.useModule(transparencyModule);
    painter.brush.useModule(spreadModule);

    painterRef.current = painter;
    shapeModuleRef.current = shapeModule;
    transparencyModuleRef.current = transparencyModule;
    spreadModuleRef.current = spreadModule;
    refreshLayers();

    return () => {
      painter.destroy();
      painterRef.current = null;
      shapeModuleRef.current = null;
      transparencyModuleRef.current = null;
      spreadModuleRef.current = null;
    };
  }, [project.height, project.width]);

  useEffect(() => {
    const painter = painterRef.current;
    if (!painter) return;

    painter.loadConfig({
      color,
      size,
      opacity,
      flow,
      spacing,
      eraser,
      roundness,
    });

    painter.setEraser(eraser);
    painter.pressureSimulation = pressureSimulation;
  }, [
    color,
    eraser,
    flow,
    opacity,
    roundness,
    size,
    spacing,
    pressureSimulation,
  ]);

  useEffect(() => {
    const shape = shapeModuleRef.current;
    const alpha = transparencyModuleRef.current;
    const spray = spreadModuleRef.current;

    if (shape instanceof DynamicShapeModule) {
      shape.bindConfig({
        sizeJitter: dynamicShape ? sizeJitter : 0,
        sizeJitterTrigger: "pressure",
        minDiameter,
        angleJitter: dynamicShape ? angleJitter : 0,
        angleJitterTrigger: "none",
        roundJitter: dynamicShape ? roundJitter : 0,
        roundJitterTrigger: "pressure",
        minRoundness,
      });
    }

    if (alpha instanceof DynamicTransparencyModule) {
      alpha.bindConfig({
        opacityJitter: transparency ? opacityJitter : 0,
        opacityJitterTrigger: "pressure",
        minOpacityJitter,
        flowJitter: transparency ? flowJitter : 0,
        flowJitterTrigger: "pressure",
        minFlowJitter,
      });
    }

    if (spray instanceof SpreadModule) {
      spray.bindConfig({
        spreadRange: spread ? spreadRange : 0,
        spreadTrigger: "pressure",
        count: spreadCount,
        countJitter: spreadCountJitter,
        countJitterTrigger: "pressure",
      });
    }
  }, [
    angleJitter,
    dynamicShape,
    flowJitter,
    minDiameter,
    minFlowJitter,
    minOpacityJitter,
    minRoundness,
    opacityJitter,
    roundJitter,
    sizeJitter,
    spread,
    spreadCount,
    spreadCountJitter,
    spreadRange,
    transparency,
  ]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateDisplaySize = () => {
      const styles = window.getComputedStyle(stage);
      const paddingX =
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const paddingY =
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
      const availableWidth = Math.max(1, stage.clientWidth - paddingX);
      const availableHeight = Math.max(1, stage.clientHeight - paddingY);
      const documentRatio = project.width / project.height;
      const availableRatio = availableWidth / availableHeight;

      if (availableRatio > documentRatio) {
        const height = availableHeight;
        setDisplaySize({
          width: height * documentRatio,
          height,
        });
        return;
      }

      const width = availableWidth;
      setDisplaySize({
        width,
        height: width / documentRatio,
      });
    };

    updateDisplaySize();

    const observer = new ResizeObserver(updateDisplaySize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, [project.height, project.width]);

  const handleLayerSelect = (layerId: string) => {
    const painter = painterRef.current;
    if (!painter) return;

    painter.setActiveLayer(layerId);
    refreshLayers();
  };

  const handleLayerUpdate = (layerId: string, updates: Partial<Layer>) => {
    const painter = painterRef.current;
    if (!painter) return;

    painter.updateLayer(layerId, updates as never);
    refreshLayers();
  };

  const addLayer = () => {
    const painter = painterRef.current;
    if (!painter) return;

    const layer = painter.createLayer({
      name: `Layer ${layers.length + 1}`,
      blendMode: "source-over",
    });

    painter.setActiveLayer(layer.id);
    refreshLayers();
  };

  const duplicateLayer = (layerId: string) => {
    const painter = painterRef.current;
    if (!painter) return;

    painter.duplicateLayer(layerId);
    refreshLayers();
  };

  const deleteLayer = (layerId: string) => {
    const painter = painterRef.current;
    if (!painter || layers.length <= 1) return;

    painter.deleteLayer(layerId);
    refreshLayers();
  };

  return (
    <section className={styles.editor}>
      <aside className={styles.sidebarLeft}>
        <div className={styles.sidebarHeader}>
          <img src="/img/fuderu.webp" alt="Fuderu" width={140} height={48} />
          <div className={styles.section}>
            <h2>Core Brush</h2>
            <Range
              label="Size"
              value={size}
              min={4}
              max={120}
              step={1}
              onChange={setSize}
            />
            <Range
              label="Opacity"
              value={opacity}
              min={0.05}
              max={1}
              step={0.01}
              onChange={setOpacity}
            />
            <Range
              label="Flow"
              value={flow}
              min={0.05}
              max={1}
              step={0.01}
              onChange={setFlow}
            />
            <Range
              label="Spacing"
              value={spacing}
              min={0.02}
              max={1}
              step={0.01}
              onChange={setSpacing}
            />
            <Range
              label="Roundness"
              value={roundness}
              min={0.05}
              max={1}
              step={0.01}
              onChange={setRoundness}
            />
            <div className={styles.field}>
              <label htmlFor="brush-color">Color</label>
              <input
                id="brush-color"
                className={styles.input}
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h2>Stroke Input</h2>
            <Toggle
              label="Mouse pressure"
              checked={pressureSimulation}
              onChange={setPressureSimulation}
            />
            <Toggle label="Eraser" checked={eraser} onChange={setEraser} />
          </div>

          <div className={styles.section}>
            <h2>Modules</h2>
            <Toggle
              label="Dynamic shape"
              checked={dynamicShape}
              onChange={setDynamicShape}
            />
            {dynamicShape && (
              <div className={styles.subControls}>
                <Range
                  label="Size jitter"
                  value={sizeJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setSizeJitter}
                />
                <Range
                  label="Angle jitter"
                  value={angleJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setAngleJitter}
                />
                <Range
                  label="Round jitter"
                  value={roundJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setRoundJitter}
                />
                <Range
                  label="Min diameter"
                  value={minDiameter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setMinDiameter}
                />
                <Range
                  label="Min roundness"
                  value={minRoundness}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setMinRoundness}
                />
              </div>
            )}
            <Toggle
              label="Transparency"
              checked={transparency}
              onChange={setTransparency}
            />
            {transparency && (
              <div className={styles.subControls}>
                <Range
                  label="Opacity jitter"
                  value={opacityJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setOpacityJitter}
                />
                <Range
                  label="Min opacity"
                  value={minOpacityJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setMinOpacityJitter}
                />
                <Range
                  label="Flow jitter"
                  value={flowJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setFlowJitter}
                />
                <Range
                  label="Min flow"
                  value={minFlowJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setMinFlowJitter}
                />
              </div>
            )}
            <Toggle label="Spread" checked={spread} onChange={setSpread} />
            {spread && (
              <div className={styles.subControls}>
                <Range
                  label="Spread range"
                  value={spreadRange}
                  min={0}
                  max={2}
                  step={0.01}
                  onChange={setSpreadRange}
                />
                <Range
                  label="Count"
                  value={spreadCount}
                  min={1}
                  max={12}
                  step={1}
                  onChange={setSpreadCount}
                />
                <Range
                  label="Count jitter"
                  value={spreadCountJitter}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setSpreadCountJitter}
                />
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <div className={styles.projectName}>{project.name}</div>
            <div className={styles.projectMeta}>
              {project.width} x {project.height} document
            </div>
          </div>
          <button
            className={styles.toolButton}
            type="button"
            onClick={onNewProject}
          >
            New Project
          </button>
        </header>

        <div className={styles.surface}>
          <div ref={stageRef} className={styles.stage}>
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              style={{
                width: `${displaySize.width}px`,
                height: `${displaySize.height}px`,
              }}
            />
          </div>
        </div>
      </div>

      <aside className={styles.sidebarRight}>
        <div className={styles.panelHeader}>
          <div>
            <h2>Layer Stack</h2>
            <p>Build your composition with visible, ordered layers.</p>
          </div>
          <button
            className={styles.toolButton}
            type="button"
            onClick={addLayer}
          >
            + Layer
          </button>
        </div>

        <div className={styles.controls}>
          <div className={styles.section}>
            <div className={styles.layerActions}>
              <button
                className={styles.toolButton}
                type="button"
                onClick={() => duplicateLayer(activeLayerId ?? "")}
                disabled={!activeLayerId}
              >
                Duplicate
              </button>
              <button
                className={styles.toolButton}
                type="button"
                onClick={() => deleteLayer(activeLayerId ?? "")}
                disabled={!activeLayerId || layers.length <= 1}
              >
                Delete
              </button>
            </div>
          </div>

          {layers.length === 0 ? (
            <div className={styles.emptyState}>
              Create a layer to start composing your drawing.
            </div>
          ) : (
            <div className={styles.layerList}>
              {layers.map((layer) => {
                const isActive = layer.id === activeLayerId;

                return (
                  <div
                    key={layer.id}
                    className={`${styles.layerCard} ${
                      isActive ? styles.layerCardActive : ""
                    }`}
                  >
                    <button
                      className={styles.layerRowButton}
                      type="button"
                      onClick={() => handleLayerSelect(layer.id)}
                    >
                      <span className={styles.layerRowLabel}>{layer.name}</span>
                      <span className={styles.layerBadge}>
                        {isActive ? "Active" : "Ready"}
                      </span>
                    </button>

                    <div className={styles.layerControls}>
                      <div className={styles.layerControlRow}>
                        <label
                          className={styles.layerControlLabel}
                          htmlFor={`name-${layer.id}`}
                        >
                          Name
                        </label>
                        <input
                          id={`name-${layer.id}`}
                          className={styles.layerNameInput}
                          value={layer.name}
                          onChange={(event) =>
                            handleLayerUpdate(layer.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </div>

                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          onChange={(event) =>
                            handleLayerUpdate(layer.id, {
                              visible: event.target.checked,
                            })
                          }
                        />
                        Visible
                      </label>

                      <div className={styles.layerControlRow}>
                        <label className={styles.layerControlLabel}>
                          Opacity
                        </label>
                        <input
                          className={styles.range}
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={layer.opacity}
                          onChange={(event) =>
                            handleLayerUpdate(layer.id, {
                              opacity: Number(event.target.value),
                            })
                          }
                        />
                      </div>

                      <div className={styles.layerControlRow}>
                        <label className={styles.layerControlLabel}>
                          Blend mode
                        </label>
                        <select
                          className={styles.select}
                          value={layer.blendMode}
                          onChange={(event) =>
                            handleLayerUpdate(layer.id, {
                              blendMode: event.target.value as BlendMode,
                            })
                          }
                        >
                          {blendModes.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.field}>
      <label>
        {label}: {value.toFixed(step >= 1 ? 0 : 2)}
      </label>
      <input
        className={styles.range}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
