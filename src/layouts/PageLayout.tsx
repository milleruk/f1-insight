import Image from "next/future/image";
import { v4 as uuidv4 } from "uuid";

import { AppLayout } from "./AppLayout";
import { IPill, Pill } from "@components/Pill";

interface IPageLayout {
  title: string;
  subtitle?: string;
  buttons?: IPill[][];
  side?: React.ReactNode;
  body: React.ReactNode;
}

interface IMenu {
  buttonGroups: IPill[][];
}

const Divider = () => <div className="h-3 w-px bg-brand-blue-200" />;

const Menu = ({ buttonGroups }: IMenu) => {
  return (
    <div className="flex items-center gap-5">
      {buttonGroups.map((buttonGroup, idx) => (
        <>
          <div key={uuidv4()} className="flex gap-[10px]">
            {buttonGroup.map((button) => (
              <Pill key={uuidv4()} {...button} />
            ))}
          </div>
          {idx < buttonGroups.length - 1 && <Divider />}
        </>
      ))}
    </div>
  );
};

export const PageLayout = ({
  title,
  subtitle,
  side,
  body,
  buttons
}: IPageLayout) => {
  return (
    <AppLayout>
      {side}
      <div className="flex flex-auto flex-col items-center gap-10 overflow-scroll bg-brand-blue-400 px-14 py-12 text-brand-white-100">
        <Image src="/f1_logo.svg" alt="" width={120} height={30} />
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-center text-[40px] font-medium text-brand-white-100">
            {title}
          </h1>
          {subtitle && (
            <p className="whitespace-pre break-normal text-center text-base font-medium uppercase text-brand-blue-100 opacity-70">
              {subtitle}
            </p>
          )}
        </div>
        {buttons && <Menu buttonGroups={buttons} />}
        {body}
      </div>
    </AppLayout>
  );
};