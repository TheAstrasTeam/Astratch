import { useRef, useState, useEffect } from 'react';
import styles from './index.module.css'


const WorkSpace = ({ vm }): React.ReactNode => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
    }, [dimensions]);
    return (
        <div className={styles.workspace} >
            <canvas ref={canvasRef}>
                {window.t("unsupported_webgl")}
            </canvas>
        </div>
    )
}

export default WorkSpace;