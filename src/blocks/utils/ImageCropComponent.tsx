import { Height } from '@mui/icons-material';
import React, { useState, useRef } from 'react';


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
    const [verticleAdjustment, setVerticleAdjustment] = useState(false);
    const [HorizontalAdjustment, setHorizontalAdjustment] = useState(false);

    const dragGrip = useRef<HTMLDivElement>(null);
    
    const handleMouseDown = (e: any, direction: number) => {
        if(direction === 0){
            setHorizontalAdjustment(true);
        }
        if(direction === 1){
            setVerticleAdjustment(true);
        }
        e.preventDefault();
    }

    const handleMouseUp = () => {
        setVerticleAdjustment(false);
        setHorizontalAdjustment(false);
    }

    const handleMouseMove = (e: any) => {
        const target = dragGrip.current;

        const rect = target?.getBoundingClientRect();
        
        if(verticleAdjustment) {
            
            const y = e.clientY - rect!.top;

            if(y < target!.offsetHeight && 0 < target!.offsetHeight){
            setHeight(y);
            }
        }

        if(HorizontalAdjustment) {
            
            const x = ((e.clientX - (rect!.left + (target!.offsetWidth/2)))*2);
            
            if(x < target!.offsetWidth && 0 < target!.offsetWidth){
            setWidth(x);
            }
        }

    }


    return (
        <div
        
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
            width: "100%",
            height: "500px",
           
        }}
        ref={dragGrip}
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
                    <div
                    className={"bg-seam-gray text-seam-gray-subtitle cursor-row-resize"}
                    onMouseDown={(event) => {handleMouseDown(event,0)}}
                    style={{
                        width: "40px",
                        height: "auto",
                        float: "left",
                        marginLeft: "10px",
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        textAlign: "center",
                        userSelect: "none",
                        padding: "5px",
                        borderRadius: "5px",
                        boxSizing: 'border-box',
                    }}
                    >
                        Adjust Width
                    </div>
                </div>
                
                <div
                className={"bg-seam-gray text-seam-gray-subtitle cursor-row-resize"}
                onMouseDown={(event) => {handleMouseDown(event,1)}}
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
                
        </div>


    )



}

export default ImageCropComponent;