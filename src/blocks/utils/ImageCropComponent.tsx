import { Height } from '@mui/icons-material';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import subwayTestImage from "../assets/Parallax/SubwayCar_02_Front.png";
import SeamSaveButton from '../../components/SeamSaveButton';

type Coordinate2D = [number, number];

// Global Functions

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

const DimensionsBasedOnWidth = ( ratio: number, inputWidth: number ) => {
    return { width: inputWidth, height: inputWidth / ratio }
}


const convertToDecimal = (numerator: number, denominator: number) => {
    return numerator / denominator;
};

// components

interface ImageCropCanvasComponentProps {
imageString: string,
CanvasWidth: number,
//CanvasHeight: number,
aspectRatio: number, // aspect ratio in array format. e.g. [16,9] 
onCanvasReady: (canvas: HTMLCanvasElement) => void,


}

const ImageCropCanvasComponent: React.FC<ImageCropCanvasComponentProps> = ({imageString, CanvasWidth, aspectRatio, onCanvasReady}) => {

    const canvasRef = useRef<HTMLCanvasElement>(null); // Main canvas element
    const [imageBeingEdited, setImageBeingEdited] = useState<HTMLImageElement | null>(null)
    const [startTouchPos, setStartTouchPos] = useState<Coordinate2D | null>(null);
    const [yOffset, setYOffset] = useState<Coordinate2D>([0,0])

    const [imageTransform, setImageTransform] = useState({ 
        xPos: 10,
        yPos: 500,
        scale: 1,
        rotation: 0,
    })

    const [CanvasResizeState, setCanvasResizeState] = useState({ // the canvas dimentions based on ratio 
        width: CanvasWidth,
        height: 100,
    })

    useEffect(() => { // draw the image
        if(!imageBeingEdited) return;
        const cropCanvas = canvasRef.current;
        if(!cropCanvas) return;
        const cropCanvasContext = cropCanvas.getContext('2d');
        if(!cropCanvasContext) return;
        
        const imageDims: Coordinate2D = [imageBeingEdited.width, imageBeingEdited.height];
        const canvasDims: Coordinate2D = [cropCanvas.width, cropCanvas.height];

        const [sx, sy, sw, sh] = [
            0,0, imageDims[0], imageDims[1]
          ];

        const [dx, dy, dw, dh] = [imageTransform.xPos, imageTransform.yPos, imageDims[0], imageDims[1]];

        cropCanvasContext.clearRect(0, 0, canvasDims[0], canvasDims[1])
        
        cropCanvasContext.fillStyle = "aliceblue"
        cropCanvasContext.fillRect(0, 0, canvasDims[0], canvasDims[1])
        
        cropCanvasContext.drawImage(imageBeingEdited, sx, sy, sw, sh, dx, dy, dw, dh);
        
    }, [imageBeingEdited, CanvasResizeState.height, imageTransform])

    const handleTouchStart = (e: React.TouchEvent) => {
        
        const touchPos: Coordinate2D = [e.touches[0].clientX, e.touches[0].clientY]
        
        console.log(touchPos)
        setYOffset([touchPos[0] - imageTransform.xPos, touchPos[1] - imageTransform.yPos])
        e.preventDefault()
    }

    const handleTouchEnd = () => {
        if(!canvasRef.current) return;
        onCanvasReady(canvasRef.current)

    }

    const handleMove = (e: React.TouchEvent) => {
        if(!imageBeingEdited) return;
        const canvas = canvasRef.current;
        if(!canvas) return;
        

        if (e.touches.length === 1) {
            const touchPos: Coordinate2D = [e.touches[0].clientX, e.touches[0].clientY]
                const posX = touchPos[0] - yOffset[0]
                const posY = touchPos[1] - yOffset[1]
                
                setImageTransform(prevState => ({
                    ...prevState,
                    xPos: posX ,
                    yPos: posY

                }))
                
        }

    }

    useEffect(()=>{ // sets the image being edited 
        if(!imageString) return;

        const img = new Image();
        img.src = imageString;
        img.onload = () => {
            setImageBeingEdited(img);
        }
    }, [])

    useEffect(() => {
        
        handleTouchEnd();

    }, [canvasRef])

    useEffect(() => { // change image size when aspect ratio is changed
        const newCanvasHeight = DimensionsBasedOnWidth(aspectRatio, CanvasResizeState.width);

        setCanvasResizeState(prevState => ({
            ...prevState,
            height: newCanvasHeight.height
        }))

    }, [aspectRatio])


return (
    
    <canvas 
    ref={canvasRef}
    width={`${CanvasResizeState.width}px`} 
    height={`${CanvasResizeState.height}px`} 
    style={{width: "100%", height: "auto", touchAction: "none"}}
    onTouchMove={e => handleMove(e)}
    onTouchStart={handleTouchStart}
    onTouchEnd={handleTouchEnd}
    ></canvas>



)

}

interface ImageCropComponentProps {
image?: string, //the image being cropped
isFixedAspectRatio?: boolean, // does the miniapp have a fixed aspect ratio/ratios. if not, allow size adjustment
AspectRatio: [number, number][], // The fix aspect ratio(s) that the post can use. index 0 is default (note - isFixedAspectRatio can still be false - the size can be adjusted, but presets are avaiable in the menu)
maxWidthPixels?: number,
fillCropArea: boolean,
maximumRatio: number,
minimumRatio: number,
onUpdate: (image: string) => void;
}

const ImageCropComponent: React.FC<ImageCropComponentProps> = ({image=subwayTestImage, isFixedAspectRatio = false, AspectRatio,maxWidthPixels = 1280, fillCropArea,maximumRatio, minimumRatio, onUpdate }) => {
    
    const [maxHeight, setMaxHeight] = useState(300);
    const [verticleAdjustment, setVerticleAdjustment] = useState(false);
    const [selectedRatio, setSelectedRatio] = useState<number | null>(null); // the selected ratio preset. null if no current preset
    
    const canvasRef = useRef<HTMLCanvasElement>(null); // Main canvas element
    const [finalImage, setFinalImage] = useState<HTMLImageElement | null>(null)
    const [finalCanvas, setFinalCanvas] = useState<HTMLCanvasElement | null>(null)

    const [decimals, setDecimals] = useState<number[]>(
        AspectRatio.map(([numerator, denominator]) =>
          convertToDecimal(numerator, denominator)
        )
      );

      useEffect(() => {
        setSelectedRatio(decimals[0]);

      }, [decimals])

    const [resizeState, setResizeState] = useState({ 
        width: 300,
        height: 300,
        canvasWidth: 1280,
        canvasHeight: 1280,
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

    const setCanvasWidthHeight = (_width: number, _height: number) => { // sets the width and height of the canvas
        
        setResizeState(prevState => ({
            ...prevState,
            canvasWidth: _width,
            canvasHeight: _height
        }))
    }

    const adjustDimensionsBasedOnRatio = ( ratio: number, maxDimension: number ) => {
        const { width, height } = (ratio >= 1)
        ? { width: maxDimension, height: maxDimension / ratio }
        : { width: maxDimension * ratio, height: maxDimension };

        return {width, height}
    }

    

    const adjustDimensionsOnResize = () => {
        const currentAspectRatio = resizeState.aspectRatio;
        const maxDimension = ResizeDragBounds.current!.offsetWidth;
        
        const size = adjustDimensionsBasedOnRatio(currentAspectRatio, maxDimension);

        setWidthHeight(size.width, size.height);
      
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

        const size = adjustDimensionsBasedOnRatio( AspectRatio[0][0]/AspectRatio[0][1], ResizeDragBounds.current.offsetWidth )
        setWidthHeight(size.width, size.height);

        // const canvasSize = DimensionsBasedOnWidth(AspectRatio[0][0]/AspectRatio[0][1], maxWidthPixels);
        // setCanvasWidthHeight(canvasSize.width, canvasSize.height)


    }, [])

    // Custom Aspect Ratio Functions

    useEffect(()=> { // Effect for handling action when threshold is crossed
        
        if(resizeState.thresholdCrossed) { 
            // width adjustment starts
            console.log("width adjustment")
        }else {
            // height adjustment resumes
            console.log("height adjustment resumes")
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
        setSelectedRatio(null);
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

                // const canvasSize = DimensionsBasedOnWidth(resizeState.aspectRatio, maxWidthPixels)
                // setCanvasWidthHeight(canvasSize.width, canvasSize.height)
            }
            
        }

    }

    useEffect(() => { // Effect enabling/disabling custom aspect ratio adjustment
        
        // console.log(ResizeDragBounds.current, isFixedAspectRatio, handleMouseDown, handleMouseUp);
        if( !ResizeDragBounds.current || isFixedAspectRatio ) return;

        ResizeDragBounds.current.addEventListener("pointermove", handleMouseMove)
        ResizeDragBounds.current.addEventListener("pointerup", handleMouseUp)
        
        return () => {
            ResizeDragBounds.current?.removeEventListener("pointermove", handleMouseMove)
            ResizeDragBounds.current?.removeEventListener("pointerup", handleMouseUp)
        }

    }, [isFixedAspectRatio, handleMouseMove, handleMouseUp])

    // JSX Components

    const dragButton =  ( // button for custom adjustments to aspect ratio when it is not a fixed ratio
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
                borderRadius: "5px",
                touchAction: "none",
            }}
            >
            Drag to adjust aspect ratio
            </div>   
    )

    const handleRatioSelect = (ratio: number) => {
        const size = adjustDimensionsBasedOnRatio(ratio, maxHeight);
        setWidthHeight(size.width, size.height);
        // const canvasSize = DimensionsBasedOnWidth(ratio, maxWidthPixels);
        // setCanvasWidthHeight(canvasSize.width, canvasSize.height)
        
        setSelectedRatio(ratio)
        
    }

    const handleCanvasReady = (canvas: HTMLCanvasElement) => {
        setFinalCanvas(canvas)
    }

    const extractImage = (canvas: HTMLCanvasElement) => {
        const img = new Image();
        img.src = canvas.toDataURL('image/png')
        setFinalImage(img)
        
    }

    return (
        <div
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
                className={'border-seam-gray-subtitle items-center'}
                style={{
                    width: resizeState.width,
                    height: resizeState.height,
                    overflow: "hidden",
                    margin: "0 auto",
                    backgroundColor: "aliceblue",
                    borderRadius: "5px",
                    
                    position: "relative",
                    display: 'flex',
                }}
                >
                    {/* canvas element */}
                    
                    <ImageCropCanvasComponent imageString={image} CanvasWidth={resizeState.canvasWidth} aspectRatio={resizeState.aspectRatio} onCanvasReady={handleCanvasReady}></ImageCropCanvasComponent>
                </div>
            </div>
            
            { isFixedAspectRatio ? null : dragButton }
            
            <div
            style={{
                display: 'flex', 
                flexDirection: "row", 
                justifyContent: "space-evenly", 
                padding: "5px", 
                marginTop: "10px",
            }}
            >
            {decimals.map((ratio,index) => (
                <label 
                key={ratio}
                className={`select-none px-5 py-3 rounded-full ${AspectRatio.length === 1 || ratio === selectedRatio ? null :'hover:bg-seam-green hover:text-seam-black'} ${selectedRatio === ratio ? "bg-blue-500 text-white" : "text-gray-800"}`}
                >
                    <input 
                    className={'opacity-0 fixed width-0'}
                    type='radio'
                    name="dynamic-radio"
                    value={ratio}
                    checked={selectedRatio === ratio}
                    onChange={() => handleRatioSelect(ratio)}
                    />
                    {AspectRatio[index][0]} : {AspectRatio[index][1]}
                </label>
            ))}
            </div>

            <SeamSaveButton onClick={() => finalCanvas && extractImage(finalCanvas)}/>

            <img style={{marginTop: "15px"}}src={finalImage?.src}/>
        </div>

    )



}

export default ImageCropComponent;