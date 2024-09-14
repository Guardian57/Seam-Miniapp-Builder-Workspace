import { Height } from '@mui/icons-material';
import React, { useState, useRef, useEffect } from 'react';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

interface ImageCropComponentProps {
image: string, //the image being cropped
isFixedAspectRatio: boolean, //does the miniapp have a fixed aspect ratio/ratios. if not, allow size adjustment
AspectRatio: number[], //the fix aspect ratio(s) that the post can use. (note - isFixedAspectRatio can still be false - the size can be adjusted, but presets are avaiable in the menu)
fillCropArea: boolean,
maximumRatio: number,
minimumRatio: number,
onUpdate: (image: string) => void;
}

const ImageCropComponent: React.FC<ImageCropComponentProps> = ({image, isFixedAspectRatio, AspectRatio, fillCropArea,maximumRatio, minimumRatio, onUpdate }) => {
    
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(300);
    const [maxHeight, setMaxHeight] = useState(300);
    const [clickOffset, setClickOffset] = useState(0)
    const [verticleAdjustment, setVerticleAdjustment] = useState(false);
    const [widthOnClick, setWidthOnClick] = useState(300);
    
    const ResizeDragBounds = useRef<HTMLDivElement>(null);

    useEffect(() => { //sets the width of the crop window to 100% of the containing element
        if(!ResizeDragBounds.current) return;

        setWidth(ResizeDragBounds.current.offsetWidth);
        setMaxHeight(ResizeDragBounds.current.offsetWidth);

    }, [])
    
    const handleMouseDown = (e: any) => {
        
            const target = ResizeDragBounds.current;
            const rect = target?.getBoundingClientRect();

            if (rect) {
                const initialOffsetY = (e.clientY - rect.top) - height;
                setClickOffset(initialOffsetY)
                setVerticleAdjustment(true);
                setWidthOnClick(width);
            }
            
            
        
        e.preventDefault();
    }

    const handleMouseUp = () => {
        setVerticleAdjustment(false);
        
    }

    const handleMouseMove = (e: any) => {
        
        if(verticleAdjustment) {
        
            const target = ResizeDragBounds.current;
            const rect = target?.getBoundingClientRect();
        
            if(rect){
            
                const y = e.clientY - rect.top; // mouse position within resize dragging div
                const yOffset = y - clickOffset;
                
                if(width === maxHeight) {
                    setWidthOnClick(width);
                setHeight(clamp(yOffset, 100, maxHeight));
                }

                if(y > maxHeight || width < maxHeight) {
                    setWidth(clamp((widthOnClick - ((yOffset - maxHeight))),100,maxHeight))
                    
                }
                


                
            }
            
        }

    }


    return (
        <div
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
        style={{
            width: "100%",
            height: "100%",
        }}
        ref={ResizeDragBounds}
        >
            <div
            style={{
                
                width: width,
                height: "auto",
                margin: "0 auto"
            }}
            >
                <div  
                style={{
                    width: "auto",
                    height: "auto",
                    display: "flex"
                }}
                >
                    
                    <div
                    className={'border-solid border-2 border-seam-gray-subtitle'}
                    style={{
                        width: "100%",
                        height: height,
                        overflow: "auto",
                        backgroundColor: "aliceblue",
                        borderRadius: "5px",
                        
                    }}
                    >
                        {/* canvas element */}
                    </div>
                </div>
                
                
                
            </div>
            <div
                className={"bg-seam-gray text-seam-gray-subtitle cursor-row-resize"}
                onPointerDown={handleMouseDown}
                style={{
                    width: "100%",
                    height: "auto",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                    userSelect: "none",
                    padding: "5px",
                    marginTop: "10px",
                    boxSizing: "border-box",
                    borderRadius: "5px"
                    
                }}
                >
                Drag to adjust aspect ratio
                </div>   
        </div>


    )



}

export default ImageCropComponent;