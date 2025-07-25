import React, {
    Children,
    cloneElement,
    forwardRef,
    isValidElement,
    ReactElement,
    ReactNode,
    RefObject,
    useEffect,
    useMemo,
    useRef,
  } from "react";
  import gsap from "gsap";
  
  export interface CardSwapProps {
    width?: number | string;
    height?: number | string;
    cardDistance?: number;
    verticalDistance?: number;
    delay?: number;
    pauseOnHover?: boolean;
    onCardClick?: (idx: number) => void;
    skewAmount?: number;
    easing?: "linear" | "elastic";
    children: ReactNode;
  }
  
  export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    customClass?: string;
  }
  
  export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ customClass, ...rest }, ref) => (
      <div
        ref={ref}
        {...rest}
        className={`absolute top-1/2 left-1/2 rounded-xl border-2 border-black bg-black overflow-hidden [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden] [image-rendering:auto] ${customClass ?? ""} ${rest.className ?? ""}`.trim()}
      />
    )
  );
  Card.displayName = "Card";
  
  type CardRef = RefObject<HTMLDivElement | null>;
  interface Slot {
    x: number;
    y: number;
    z: number;
    zIndex: number;
  }
  
  const makeSlot = (
    i: number,
    distX: number,
    distY: number,
    total: number
  ): Slot => ({
    x: i * distX,
    y: -i * distY,
    z: -i * distX * 1.5,
    zIndex: total - i,
  });
  
  const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
    gsap.set(el, {
      x: slot.x,
      y: slot.y,
      z: slot.z,
      xPercent: -50,
      yPercent: -50,
      skewY: skew,
      transformOrigin: "center center",
      zIndex: slot.zIndex,
      force3D: true,
    });
  
  const CardSwap: React.FC<CardSwapProps> = ({
    width = 500,
    height = 400,
    cardDistance = 60,
    verticalDistance = 70,
    delay = 3500,
    pauseOnHover = false,
    onCardClick,
    skewAmount = 6,
    easing = "elastic",
    children,
  }) => {
    const config =
      easing === "elastic"
        ? {
            ease: "elastic.out(0.6,0.9)",
            durDrop: 1.5,
            durMove: 1.8,
            durReturn: 1.8,
            promoteOverlap: 0.8,
            returnDelay: 0.1,
          }
        : {
            ease: "power2.inOut",
            durDrop: 1.2,
            durMove: 1.0,
            durReturn: 1.2,
            promoteOverlap: 0.6,
            returnDelay: 0.15,
          };
  
    const childArr = useMemo(
      () => Children.toArray(children) as ReactElement<CardProps>[],
      [children]
    );
    const refs = useMemo<CardRef[]>(
      () => childArr.map(() => React.createRef<HTMLDivElement>()),
      [childArr.length]
    );
  
    const order = useRef<number[]>(
      Array.from({ length: childArr.length }, (_, i) => i)
    );
  
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const intervalRef = useRef<number | undefined>(undefined);
    const container = useRef<HTMLDivElement>(null);
  
        useEffect(() => {
      const total = refs.length;
      
      // Attendre que le DOM soit prêt et que toutes les refs soient attachées
      const initializeAnimation = () => {
        const allRefsAttached = refs.every(r => r.current !== null);
        if (!allRefsAttached) return;
        
        refs.forEach((r, i) =>
          placeNow(
            r.current!,
            makeSlot(i, cardDistance, verticalDistance, total),
            skewAmount
          )
        );
        
        // Démarrer l'animation après la première configuration
        setTimeout(() => {
          swap();
          intervalRef.current = window.setInterval(swap, delay);
        }, 100);
      };

      const swap = () => {
        if (order.current.length < 2) return;

        const [front, ...rest] = order.current;
        const elFront = refs[front].current;
        if (!elFront) return;
        
        const tl = gsap.timeline();
        tlRef.current = tl;
  
        tl.to(elFront, {
          y: "+=500",
          x: "+=100", 
          rotation: 5, 
          duration: config.durDrop,
          ease: config.ease,
        });
  
        tl.addLabel("promote", `-=${config.durDrop * config.promoteOverlap}`);
        rest.forEach((idx, i) => {
          const el = refs[idx].current;
          if (!el) return;
          
          const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
          tl.set(el, { zIndex: slot.zIndex }, "promote");
          tl.to(
            el,
            {
              x: slot.x,
              y: slot.y,
              z: slot.z,
              duration: config.durMove,
              ease: config.ease,
            },
            `promote+=${i * 0.15}`
          );
        });
  
        const backSlot = makeSlot(
          refs.length - 1,
          cardDistance,
          verticalDistance,
          refs.length
        );
        tl.addLabel("return", `promote+=${config.durMove * config.returnDelay}`);
        tl.call(
          () => {
            gsap.set(elFront, { zIndex: backSlot.zIndex });
          },
          undefined,
          "return"
        );
        tl.to(
          elFront,
          {
            x: backSlot.x,
            y: backSlot.y,
            z: backSlot.z,
            rotation: 0, 
            duration: config.durReturn,
            ease: config.ease,
          },
          "return"
        );
  
                tl.call(() => {
          order.current = [...rest, front];
        });
      };

      setTimeout(initializeAnimation, 35);

      if (pauseOnHover) {
        const node = container.current!;
        const pause = () => {
          tlRef.current?.pause();
          clearInterval(intervalRef.current);
        };
        const resume = () => {
          tlRef.current?.play();
          intervalRef.current = window.setInterval(swap, delay);
        };
        node.addEventListener("mouseenter", pause);
        node.addEventListener("mouseleave", resume);
        return () => {
          node.removeEventListener("mouseenter", pause);
          node.removeEventListener("mouseleave", resume);
          clearInterval(intervalRef.current);
        };
      }
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (tlRef.current) {
          tlRef.current.kill();
        }
      };
    }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing, refs]);
  
    const rendered = childArr.map((child, i) =>
      isValidElement<CardProps>(child)
        ? cloneElement(child, {
                      key: i,
          ref: refs[i],
          style: { 
            width, 
            height, 
            minWidth: width,
            minHeight: height,
            ...(child.props.style ?? {}) 
          },
          onClick: (e) => {
            child.props.onClick?.(e as React.MouseEvent<HTMLDivElement>);
            onCardClick?.(i);
          },
          } as CardProps & React.RefAttributes<HTMLDivElement>)
        : child
    );
  
    return (
      <div
        ref={container}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 perspective-[900px] overflow-visible max-[768px]:scale-[0.75] max-[480px]:scale-[0.55]"
        style={{ width, height }}
      >
        {rendered}
      </div>
    );
  };
  
  export default CardSwap;
  