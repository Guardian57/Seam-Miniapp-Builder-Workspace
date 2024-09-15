import { Height } from '@mui/icons-material';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

const findDimension = (ratio: number, width?: number, height?: number) => {
    if(width !== undefined){
        return { width, height: width / ratio }
    }
    if(height !== undefined){
        return { width: height * ratio, height }
    }
    throw new Error("Either width or height must be provided");
}

interface ImageCropComponentProps {
image: string, //the image being cropped
isFixedAspectRatio: boolean, // does the miniapp have a fixed aspect ratio/ratios. if not, allow size adjustment
AspectRatio: number[], // The fix aspect ratio(s) that the post can use. index 0 is default (note - isFixedAspectRatio can still be false - the size can be adjusted, but presets are avaiable in the menu)
fillCropArea: boolean,
maximumRatio: number,
minimumRatio: number,
onUpdate: (image: string) => void;
}

const ImageCropComponent: React.FC<ImageCropComponentProps> = ({image, isFixedAspectRatio, AspectRatio, fillCropArea,maximumRatio, minimumRatio, onUpdate }) => {
    
    // const [width, setWidth] = useState(300);
    // const [height, setHeight] = useState(300);
    const [maxHeight, setMaxHeight] = useState(300);
    // const [clickOffset, setClickOffset] = useState(0)
    const [verticleAdjustment, setVerticleAdjustment] = useState(false);
    // const [widthOnClick, setWidthOnClick] = useState(300);

    const [resizeState, setResizeState] = useState({
        height: 300,
        width: 300,
        aspectRatio: 1, // current aspect ratio of the post
        thresholdCrossed: false, // the threshold where resizing changes from height to width so it fits on the page
        widthOnClick: 0, // stores the width of the crop window on click. used to resize crop window when width is above threshold
        clickOffset: 0, // the distance mouse is from the bottom of the frame
    })
    
    const ResizeDragBounds = useRef<HTMLDivElement>(null);

    const setWidthHeight = (_width: number, _height: number) => { // sets the width and height of the crop window
        const aspectRatio = _width / _height

        setResizeState(prevState => ({
            ...prevState,
            width: _width,
            height: _height,
            aspectRatio,
            thresholdCrossed: _width < _height ? true : false
        }))
    }

    const adjustDimensionsBasedOnRatio = ( ratio: number, maxDimension: number ) => {
        const { width, height } = (ratio >= 1)
        ? { width: maxDimension, height: maxDimension / ratio }
        : { width: maxDimension * ratio, height: maxDimension };

        setWidthHeight(width, height);
    }

    const adjustDimensionsOnResize = () => {
        const currentAspectRatio = resizeState.aspectRatio;
        const maxDimension = ResizeDragBounds.current!.offsetWidth;
        


        // Adjust width and height based on current aspect ratio
        if (currentAspectRatio >= 1) {
            const newWidth = maxDimension;
            const newHeight = maxDimension / currentAspectRatio;
            setWidthHeight(newWidth, newHeight);
        } else {
            const newWidth = maxDimension * currentAspectRatio;
            const newHeight = maxDimension;
            setWidthHeight(newWidth, newHeight);
        }
        
    };

    useLayoutEffect(() => {
        const handleResize = () => adjustDimensionsOnResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize); 
    }, [resizeState.aspectRatio])

    

    useLayoutEffect(() => { // sets the width of the crop window to 100% of the containing element
        if(!ResizeDragBounds.current) return;
        console.log(ResizeDragBounds.current)

        setMaxHeight(ResizeDragBounds.current.offsetWidth); 

        adjustDimensionsBasedOnRatio( AspectRatio[0], ResizeDragBounds.current.offsetWidth )

        

    }, [])

    

    useEffect(()=> { // Effect for handling action when threshold is crossed
        
        if(resizeState.thresholdCrossed) { 
            // width adjustment starts
            console.log("width adjustment")
        }else {
            // height adjustment resumes
            console.log("height adjustment resumes")
            
            // setResizeState(prevState => ({
            //     ...prevState,
            //     height: maxHeight
            // }))

            // setVerticleAdjustment(false)
            
            

        }

    }, [resizeState.thresholdCrossed]);



    const handleThresholdCrossing = (yOffset: number, clickOffset: number) => {
        const {thresholdCrossed, width, height} = resizeState;
        
        if(yOffset > maxHeight && !thresholdCrossed){ // start width adjustment
            setResizeState(prevState => ({
                ...prevState,
                thresholdCrossed: true,
                widthOnClick: width,
            }))
        } else if (yOffset < maxHeight && width >= maxHeight && thresholdCrossed) { //go to height adjustment
            
            setResizeState(prevState => ({
                ...prevState,
                thresholdCrossed: false,
                widthOnClick: width,
                height: maxHeight,
                clickOffset: getYOffset(clickOffset)
            }))
        }
    }
    
    const getYOffset = (mousePosY: number) => {
        let yOffset = 0;
        const target = ResizeDragBounds.current;
        const rect = target?.getBoundingClientRect();

        if (rect) {
            yOffset = (mousePosY - rect.top) - resizeState.height;
        }

        return yOffset

    }

    const handleMouseDown = (e: any) => {
        setVerticleAdjustment(true);
        setResizeState(prevState => ({
            ...prevState,
            widthOnClick: resizeState.width,
            clickOffset: getYOffset(e.clientY)
        }))
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
                const yOffset = y - resizeState.clickOffset; // mouse position with the offset from the bottom of the frame applied

                setResizeState(prevState => {
                    if(prevState.thresholdCrossed){
                        
                        const clampedWidth = clamp(prevState.widthOnClick - (yOffset - maxHeight), 100, maxHeight)
                        const aspectRatio = clampedWidth / prevState.height
                        return {
                            ...prevState,
                            width: clampedWidth,
                            aspectRatio,
                        }
                    } else {
                        
                        const clampedHeight = clamp(yOffset, 100, maxHeight)
                        const aspectRatio = prevState.width / clampedHeight
                        return {
                            ...prevState,
                            height: clampedHeight,
                            aspectRatio,
                        }
                    }
                })
                
                handleThresholdCrossing(yOffset, e.clientY);
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
                    width: "auto",
                    height: "auto",
                    display: "flex"
                }}
                >
                    
                    <div
                    className={'border-solid border-2 border-seam-gray-subtitle'}
                    style={{
                        width: resizeState.width,
                        height: resizeState.height,
                        overflow: "auto",
                        margin: "0 auto",
                        backgroundColor: "aliceblue",
                        borderRadius: "5px",
                        
                    }}
                    >
                        {/* canvas element */}
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