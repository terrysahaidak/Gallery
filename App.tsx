import React, {
  useRef,
  MutableRefObject,
  useMemo,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  Animated,
  View,
  StyleSheet,
  ScrollView,
  UIManager,
  findNodeHandle,
  Dimensions,
  Text,
  Easing,
  Image as RNImage,
} from 'react-native';
import Image from 'react-native-fast-image';
import {
  TouchableOpacity,
  PanGestureHandler,
  State,
  PanGestureHandlerProperties,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import {interpolate} from './utils';

const {E} = Animated;

const window = Dimensions.get('window');

const images = [
  {
    id: 1,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 2,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 3,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 4,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 5,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 6,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
  {
    id: 7,
    src:
      'https://i0.wp.com/itc.ua/wp-content/uploads/2019/09/Tesla-Model-S-speed.jpg?fit=2000%2C1334&quality=100&strip=all&ssl=1',
    height: 1334,
    width: 2000,
  },
  {
    id: 8,
    src:
      'https://upload.wikimedia.org/wikipedia/commons/e/eb/Bangabandhu_Satellite-1_Mission_%2842025499722%29.jpg',
    height: 3000,
    width: 2000,
  },
];

interface IImage {
  id: number;
  src: string;
  width: number;
  height: number;
}

const s = StyleSheet.create({
  image: {
    width: 80,
    height: 80,
  },

  root: {
    opacity: 1,
    paddingTop: 20,
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
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

interface SmallImageProps {
  item: IImage;
  onPress: (ref: TouchableRef, item: IImage) => void;
}

type TouchableRef = MutableRefObject<TouchableOpacity | null>;

const SmallImage = ({item, onPress}: SmallImageProps) => {
  const ref = useRef(null);

  const handlePress = () => {
    onPress(ref, item);
  };

  return (
    <View
      onLayout={() => {}}
      removeClippedSubviews={false}
      ref={ref}
      style={{opacity: 1}}>
      <TouchableOpacity onPress={handlePress}>
        <Image source={{uri: item.src}} style={[s.image]} />
      </TouchableOpacity>
    </View>
  );
};

function useAnimatedValue(
  value: number,
  useListener?: boolean,
  debugLabel?: string,
) {
  const lastValue = useRef(null);

  return useMemo<Animated.Value>(() => {
    const node = new Animated.Value(value);

    if (useListener) {
      node.addListener(value => {
        lastValue.current = value.value;

        if (debugLabel) {
          console.log(debugLabel, value.value);
        }
      });

      node.getValue = () => lastValue.current;
    }

    node.__makeNative();

    return node;
  }, []);
}

function useInterpolation(master: Animated.Value, range: [number, number]) {
  return master.interpolate({
    inputRange: [0, 1],
    outputRange: range,
  });
}
function useExpressionInterpolation(
  master: Animated.Value,
  range: [number, number],
) {
  return Animated.expression(
    interpolate(master, {
      inputRange: [0, 1],
      outputRange: range,
    }),
  );
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
  componentRef: TouchableRef;
  item: IImage;
  onClose: () => void;
}

function useTiming(
  value: Animated.Value,
  config: Animated.TimingAnimationConfig,
) {
  return useMemo(() => {
    return Animated.timing(value, {
      ...config,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
  }, []);
}

function useSpring(value: Animated.Value, config: {toValue: number}) {
  return useMemo(() => {
    return Animated.spring(value, {
      tension: 90,
      friction: 30,
      ...config,
      useNativeDriver: true,
    });
  }, []);
}

function useSprings(animations: [Animated.Value, number][], deps = []) {
  return useMemo(() => {
    return Animated.parallel(
      animations.map(([value, toValue]) =>
        Animated.spring(value, {
          tension: 90,
          friction: 30,
          toValue,
          useNativeDriver: true,
        }),
      ),
    );
  }, deps);
}

async function getDimensions(
  ref: TouchableRef,
  src: string,
): Promise<IDimensions> {
  const nodeId = findNodeHandle(ref.current);

  if (nodeId === null) {
    throw new Error('NodeId cannot be null');
  }

  const measurePromise: Promise<IViewDimensions> = new Promise(res =>
    UIManager.measure(nodeId, (x, y, width, height) => {
      res({width, height, x, y});
    }),
  );
  const imagePromise: Promise<ITargetDimensions> = new Promise((res, rej) =>
    RNImage.getSize(
      src,
      (width, height) => {
        const screenWidth = window.width;
        const scaleFactor = width / screenWidth;
        const targetHeight = height / scaleFactor;
        res({targetWidth: screenWidth, targetHeight});
      },
      err => rej(err),
    ),
  );

  const [nodeDimensions, imageDimensions] = await Promise.all([
    measurePromise,
    imagePromise,
  ]);

  return Object.assign({}, nodeDimensions, imageDimensions);
}

function Gallery({componentRef, item, onClose}: GalleryProps) {
  const [dimensions, setDimensions] = useState<IDimensions>();
  const transition = useAnimatedValue(0);
  // const openAnimation = useTiming(transition, {
  //   toValue: 1,
  //   duration: 300,
  // });
  // const closeAnimation = useTiming(transition, {
  //   toValue: 0,
  //   duration: 300,
  // });
  // const openAnimation = useSpring(transition, {
  //   toValue: 1,
  // });
  // const closeAnimation = useSpring(transition, {
  //   toValue: 0,
  // });

  useEffect(() => {
    if (!dimensions) {
      // @ts-ignore
      transition.__makeNative();

      const nodeId = findNodeHandle(componentRef.current);

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
      // getDimensions(componentRef, item).then(dimensions => {
      //   setDimensions(dimensions);
      // });
    }
  }, []);

  const opacity = transition.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1, 1],
  });

  // function handleClose() {
  //   closeAnimation.start(() => {
  //     onClose();
  //   });
  // }

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
          handleClose={onClose}
          item={item}
        />
      )}

      <Animated.Text onPress={onClose} style={[s.close, {opacity}]}>
        Close
      </Animated.Text>
    </Animated.View>
  );
}

function useGestureEvent(nativeEvent: any) {
  return useMemo(
    () =>
      Animated.event(
        [
          {
            nativeEvent,
          },
        ],
        {useNativeDriver: true},
      ),
    [],
  );
}

interface ImageProps {
  item: IImage;
  dimensions: IDimensions;
  transition: Animated.Value;
}

function useCode(expression, deps = []) {
  useEffect(() => {
    const node = Animated.expression(expression());

    node.__attach();

    return () => {
      node.__detach();
    };
  }, deps);
}

const GalleryImage = ({
  item,
  transition,
  dimensions,
  handleClose,
}: ImageProps) => {
  const panY = useAnimatedValue(0, true);
  const gestureState = useAnimatedValue(-1);
  const translateY = useAnimatedValue(dimensions.y, true, 'TranslateY');
  const translateX = useAnimatedValue(dimensions.x);
  const imageWidth = useAnimatedValue(dimensions.width);
  const imageHeight = useAnimatedValue(dimensions.height);
  const translateYTarget = useAnimatedValue(dimensions.y, true, 'Target');

  const onGestureEvent = useGestureEvent({
    state: gestureState,
    translationY: panY,
  });

  const imageTranslateYPosition = (window.height - dimensions.targetHeight) / 2;

  const openAnimation = useSprings([
    [translateY, imageTranslateYPosition],
    [translateX, 0],
    [imageWidth, dimensions.targetWidth],
    [imageHeight, dimensions.targetHeight],
  ]);

  const closeAnimation = useSprings([
    [translateY, translateYTarget],
    [translateX, dimensions.x],
    [imageWidth, dimensions.width],
    [imageHeight, dimensions.height],
  ]);

  useCode(() =>
    E.cond(E.eq(gestureState, State.ACTIVE), E.set(translateY, panY)),
  );

  // const translateYWithDrag = Animated.expression(

  //     E.block([E.set(translateYTarget, panY), E.add(translateY, panY)]),
  //     translateY,
  //   ),
  // );

  const dismissCloseAnimation = useSpring(translateY, {
    toValue: imageTranslateYPosition,
  });

  const onHandlerStateChange = useCallback(
    (event: PanGestureHandlerStateChangeEvent) => {
      if (event.nativeEvent.state === State.END) {
        if (panY.getValue() > 400) {
          closeAnimation.start(() => {
            handleClose();
          });
        } else {
          dismissCloseAnimation.start(() => {});
        }
      }
    },
    [],
  );

  useEffect(() => {
    openAnimation.start();
  }, []);

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}>
      <Animated.Image
        source={{uri: item.src}}
        style={{
          width: imageWidth,
          height: imageHeight,
          transform: [{translateX}, {translateY}],
        }}
      />
    </PanGestureHandler>
  );
};

const App = () => {
  const [galleryProps, setGalleryProps] = useState<GalleryProps | null>(null);

  function onImagePress(ref: TouchableRef, item: IImage) {
    setGalleryProps({
      componentRef: ref,
      item,
      onClose: () => setGalleryProps(null),
    });
  }

  return (
    <>
      <View removeClippedSubviews={false} style={s.root}>
        <ScrollView contentContainerStyle={s.scrollContent}>
          {images.map(item => (
            <SmallImage key={item.id} onPress={onImagePress} item={item} />
          ))}
        </ScrollView>
      </View>
      {galleryProps && <Gallery {...galleryProps} />}
    </>
  );
};

export default App;
