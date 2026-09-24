import { useMemo, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import ImageViewer from "@/components/ImageViewer";
import { goBack } from "@/components/ScreenHeader";

/** Visionneuse plein écran des captures (ouverte depuis la galerie d'une fiche). */
export default function GalleryScreen() {
    const params = useLocalSearchParams();
    const images = useMemo(() => {
        try {
            return JSON.parse(params.images ?? "[]");
        } catch {
            return [];
        }
    }, [params.images]);
    const [index, setIndex] = useState(() => Math.min(Number(params.index) || 0, Math.max(images.length - 1, 0)));

    if (!images.length) return null;
    return <ImageViewer screenshots={images} index={index} onIndexChange={setIndex} onClose={goBack} />;
}
