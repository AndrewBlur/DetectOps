import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Alert,
  Popover,
  Autocomplete,
  TextField,
  IconButton,
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export type BoxType = {
  id: string; // uuid
  x: number; // normalized [0..1]
  y: number;
  w: number;
  h: number;
  tag?: string;
  meta?: Record<string, unknown>;
};

type Props = {
  imageUrl: string;
  boxes: BoxType[];
  onBoxesChange: (boxes: BoxType[]) => void;
  existingTags: string[];
  onNewTag: (tag: string) => void;
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// A temporary box being drawn or tagged
type TempBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const Annotator: React.FC<Props> = ({
  imageUrl,
  boxes,
  onBoxesChange,
  existingTags,
  onNewTag,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPx, setStartPx] = useState<{ x: number; y: number } | null>(null);
  const [drawingBox, setDrawingBox] = useState<TempBox | null>(null);
  const [taggingBox, setTaggingBox] = useState<TempBox | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onLoad = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.addEventListener("load", onLoad);
    setImgSize({ w: 0, h: 0 });
    return () => img.removeEventListener("load", onLoad);
  }, [imageUrl]);
  
  useEffect(() => {
    const img = imgRef.current;
    if(img && img.naturalWidth > 0 && imgSize.w === 0) {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, [imgRef, imageUrl, imgSize.w]);

  const clientToImage = (clientX: number, clientY: number) => {
    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (imgSize.w / rect.width),
      y: (clientY - rect.top) * (imgSize.h / rect.height),
    };
  };

  const norm = (px: number, axisSize: number) => Math.max(0, Math.min(1, px / axisSize));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imgRef.current) return;
    setIsDrawing(true);
    const p = clientToImage(e.clientX, e.clientY);
    setStartPx({ x: p.x, y: p.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPx) return;
    const p = clientToImage(e.clientX, e.clientY);
    const x0 = Math.min(startPx.x, p.x);
    const x1 = Math.max(startPx.x, p.x);
    const y0 = Math.min(startPx.y, p.y);
    const y1 = Math.max(startPx.y, p.y);
    setDrawingBox({ id: 'drawing', x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  };

  const handleMouseUp = (_e: React.MouseEvent) => {
    if (!isDrawing || !drawingBox) {
      setIsDrawing(false);
      setDrawingBox(null);
      return;
    }

    if (drawingBox.w < 5 || drawingBox.h < 5) {
      setError("Bounding box is too small.");
    } else {
      setTaggingBox(drawingBox);
      const anchor = document.createElement('div');
      const containerRect = containerRef.current!.getBoundingClientRect();
      const scaleX = containerRect.width / imgSize.w;
      const scaleY = containerRect.height / imgSize.h;
      anchor.style.position = 'absolute';
      anchor.style.left = `${drawingBox.x * scaleX + containerRect.left}px`;
      anchor.style.top = `${drawingBox.y * scaleY + containerRect.top}px`;
      document.body.appendChild(anchor);
      setPopoverAnchor(anchor);
    }

    setIsDrawing(false);
    setStartPx(null);
    setDrawingBox(null);
  };
  
  const handleSaveTag = (tag: string | null) => {
    if(!taggingBox || !tag){
        handleCancelTag();
        return;
    }
    
    if (!existingTags.includes(tag)) {
        onNewTag(tag);
    }

    const newBox: BoxType = {
        ...taggingBox,
        id: uid(),
        tag,
        x: norm(taggingBox.x, imgSize.w),
        y: norm(taggingBox.y, imgSize.h),
        w: norm(taggingBox.w, imgSize.w),
        h: norm(taggingBox.h, imgSize.h),
    };
    onBoxesChange([...boxes, newBox]);
    handleCancelTag();
  };

  const handleCancelTag = () => {
    if (popoverAnchor) {
        document.body.removeChild(popoverAnchor);
    }
    setPopoverAnchor(null);
    setTaggingBox(null);
  };


  const removeBox = (id: string) => onBoxesChange(boxes.filter((b) => b.id !== id));
  const updateBoxTag = (id: string, tag: string) => onBoxesChange(boxes.map((b) => (b.id === id ? { ...b, tag } : b)));

  const overlayRect = (b: BoxType | TempBox) => {
    if(!containerRef.current || !imgSize.w || !imgSize.h) return { left: 0, top: 0, width: 0, height: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imgSize.w;
    const scaleY = rect.height / imgSize.h;
    
    if ('tag' in b) {
         return { left: b.x * imgSize.w * scaleX, top: b.y * imgSize.h * scaleY, width: b.w * imgSize.w * scaleX, height: b.h * imgSize.h * scaleY };
    }
    return { left: b.x * scaleX, top: b.y * scaleY, width: b.w * scaleX, height: b.h * scaleY };
  };

  return (
    <Box sx={{ display: "flex", gap: 2, width: "100%", justifyContent: "center" }}>
      <Box
        ref={containerRef}
        sx={{
          position: "relative", width: "auto", maxWidth: "80%",
          border: "1px solid #444", userSelect: "none",
          cursor: "crosshair",
          "& img": { maxWidth: "100%", height: "auto", display: "block" },
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <img ref={imgRef} src={imageUrl} alt="annotate" />
        <Box sx={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }}>
          {boxes.map((b) => {
            const r = overlayRect(b);
            const isHovered = b.id === hoveredBoxId;
            return (
              <Box 
                key={b.id} 
                sx={{ position: 'absolute', ...r, border: isHovered ? '2px solid red' : '2px solid lime', pointerEvents: 'auto', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredBoxId(b.id)}
                onMouseLeave={() => setHoveredBoxId(null)}
              >
                <Typography sx={{fontSize: 12, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 4px', width: 'fit-content' }}>
                  {b.tag}
                </Typography>
                {isHovered && (
                    <Box sx={{position: 'absolute', top: -28, right: 0, background: 'rgba(0,0,0,0.7)', borderRadius: 1}}>
                        <IconButton size="small" onClick={() => { const tag = prompt("New tag", b.tag ?? ""); if (tag) updateBoxTag(b.id, tag); }}>
                            <EditIcon fontSize="inherit" sx={{color: 'white'}} />
                        </IconButton>
                        <IconButton size="small" onClick={() => removeBox(b.id)}>
                            <DeleteIcon fontSize="inherit" sx={{color: 'red'}} />
                        </IconButton>
                    </Box>
                )}
              </Box>
            );
          })}
          {drawingBox && <Box sx={{ position: 'absolute', ...overlayRect(drawingBox), border: '2px dashed yellow', pointerEvents: 'none' }} />}
          {taggingBox && <Box sx={{ position: 'absolute', ...overlayRect(taggingBox), border: '2px solid yellow', pointerEvents: 'none' }} />}
        </Box>
      </Box>

      <TagPopover 
        anchorEl={popoverAnchor}
        onClose={handleCancelTag}
        onSave={handleSaveTag}
        existingTags={existingTags}
      />
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)'}}>{error}</Alert>}
    </Box>
  );
};

interface TagPopoverProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    onSave: (tag: string | null) => void;
    existingTags: string[];
}

const TagPopover: React.FC<TagPopoverProps> = ({ anchorEl, onClose, onSave, existingTags }) => {
    const [tagValue, setTagValue] = useState<string | null>(null);

    const handleSave = () => {
        onSave(tagValue);
        setTagValue(null);
    }
    
    const handleClose = () => {
        onClose();
        setTagValue(null);
    }

    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, width: 250 }}>
                <Typography>Tag this box</Typography>
                <Autocomplete
                    freeSolo
                    value={tagValue}
                    onChange={(_event, newValue) => setTagValue(newValue)}
                    onInputChange={(_event, newInputValue) => setTagValue(newInputValue)}
                    options={existingTags}
                    renderInput={(params) => <TextField {...params} label="Select or type a tag" autoFocus />}
                    size="small"
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1}}>
                    <Button onClick={handleClose} size="small">Cancel</Button>
                    <Button onClick={handleSave} variant="contained" size="small" disabled={!tagValue}>Save</Button>
                </Box>
            </Box>
        </Popover>
    )
}
