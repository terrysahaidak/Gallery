import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useCallback,
  useContext,
  createContext,
} from 'react';
import {
  Animated,
  StyleSheet,
  UIManager,
  findNodeHandle,
  Dimensions,
} from 'react-native';
import Image from 'react-native-fast-image';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {
  useSpring,
  useAnimatedValue,
  useGestureEvent,
  useSprings,
  createTimings,
  withOffset,
} from './helpers';

// TODO: Fix using fast image
// const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedImage = Animated.Image;

const window = Dimensions.get('window');

const s = StyleSheet.create({
  galleryContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  close: {
    position: 'absolute',
    left: 16,
    top: 36,
    fontSize: 17,
    color: 'white',
  },
});

export interface IGalleryItem {
  id: number;
  src: string;
  width: number;
  height: number;
}

type IGalleryContext = {
  setGalleryProps: (props: GalleryProps) => void;
  onClose: () => void;
  galleryProps: GalleryProps | null;
  transition: Animated.Value;
};

const GalleryContext = createContext<IGalleryContext>(null);

export function GalleryProvider({children}) {
  const [galleryProps, setGalleryProps] = useState<GalleryProps | null>(null);
  const transition = useAnimatedValue(0);

  const showGallery = galleryProps !== null;

  const ctx = useMemo<IGalleryContext>(
    () => ({
      setGalleryProps,
      onClose: () => setGalleryProps(null),
      transition,
      galleryProps,
    }),
    [galleryProps],
  );

  return (
    <GalleryContext.Provider value={ctx}>
      {children}
      {showGallery && <Gallery />}
    </GalleryContext.Provider>
  );
}

export function useLightbox(item: IGalleryItem) {
  const imageRef = useRef(null);
  const {setGalleryProps, onClose, galleryProps, transition} = useContext<
    IGalleryContext
  >(GalleryContext);

  const isActive = galleryProps?.item.id === item.id;

  const opacity = isActive
    ? transition.interpolate({
        inputRange: [0, 0.001, 1],
        outputRange: [1, 0, 0],
      })
    : 1;

  function onPress() {
    setGalleryProps({
      imageRef,
      item,
      onClose,
    });
  }

  return {
    imageRef,
    openLightbox: onPress,
    transition,
    opacity,
  };
}

interface ITargetDimensions {
  targetHeight: number;
  targetWidth: number;
}

interface IViewDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

type IDimensions = ITargetDimensions & IViewDimensions;

interface GalleryProps {
  imageRef: TouchableRef;
  item: IImage;
  onClose: () => void;
}

function Gallery() {
  const {galleryProps, onClose, transition} = useContext<IGalleryContext>(
    GalleryContext,
  );

  const [dimensions, setDimensions] = useState<IDimensions>();
  const onCloseRef = useRef();

  const {imageRef, item} = galleryProps!;

  useEffect(() => {
    if (!dimensions) {
      const nodeId = findNodeHandle(imageRef.current);

      if (nodeId === null) {
        throw new Error('NodeId cannot be null');
      }

      UIManager.measure(nodeId, (x, y, width, height, pageX, pageY) => {
        const targetWidth = window.width;
        const scaleFactor = item.width / targetWidth;
        const targetHeight = item.height / scaleFactor;

        setDimensions({
          width,
          height,
          x: pageX,
          y: pageY,
          targetHeight,
          targetWidth,
        });
      });
    }
  }, []);

  const opacity = transition.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <Animated.View style={[s.galleryContainer]}>
      <Animated.View
        style={{
          opacity,
          flex: 1,
          backgroundColor: 'black',
          ...StyleSheet.absoluteFillObject,
        }}
      />
      {dimensions && (
        <GalleryImage
          dimensions={dimensions}
          transition={transition}
          onClose={onClose}
          onCloseRef={onCloseRef}
          item={item}
        />
      )}

      <Animated.Text
        onPress={() => onCloseRef.current?.()}
        style={[s.close, {opacity}]}>
        Close
      </Animated.Text>
    </Animated.View>
  );
}

interface ImageProps {
  item: IImage;
  dimensions: IDimensions;
  transition: Animated.Value;
}

const GalleryImage = ({
  item,
  transition,
  dimensions,
  onClose,
  onCloseRef,
}: ImageProps) => {
  const panY = useAnimatedValue(0, true);
  const gestureState = useAnimatedValue(-1);
  const translateY = useAnimatedValue(dimensions.y, true);
  const translateX = useAnimatedValue(dimensions.x);
  const imageWidth = useAnimatedValue(dimensions.width);
  const imageHeight = useAnimatedValue(dimensions.height);

  const onGestureEvent = useGestureEvent({
    state: gestureState,
    translationY: panY,
  });

  const translateWithOffset = Animated.expression(
    withOffset(gestureState, panY, translateY),
  );

  const imageTranslateYPosition = (window.height - dimensions.targetHeight) / 2;

  const openAnimation = useSprings([
    [transition, 1],
    [translateY, imageTranslateYPosition],
    [translateX, 0],
    [imageWidth, dimensions.targetWidth],
    [imageHeight, dimensions.targetHeight],
  ]);

  function handleClose() {
    const closeAnimation = createTimings([
      [transition, 0],
      [translateY, dimensions.y - panY.getValue()],
      [translateX, dimensions.x],
      [imageWidth, dimensions.width],
      [imageHeight, dimensions.height],
    ]);

    closeAnimation.start(() => {
      onClose();
    });
  }

  onCloseRef.current = handleClose;

  const dismissCloseAnimation = useSpring(panY, 0);

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.END) {
        if (panY.getValue() > 50) {
          handleClose();
        } else {
          dismissCloseAnimation.start(() => {});
        }
      }
    },
    [],
  );

  useEffect(() => {
    openAnimation.start(() => {});
  }, []);

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <AnimatedImage
        source={{uri: item.src}}
        style={{
          width: imageWidth,
          height: imageHeight,
          transform: [{translateX}, {translateY: translateWithOffset}],
        }}
      />
    </PanGestureHandler>
  );
};
