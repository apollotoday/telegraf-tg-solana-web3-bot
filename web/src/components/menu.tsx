import { Menu } from "@/config/menu";
import Link from "next/link";

export const HeaderMenu = () => {
  return (
    <div>
      <ul className="flex gap-[16px]">
        {Menu.map((list) => {
          return (
            <li
              key={list.name}
              className="p-[10px] text-[14px] font-normal text-[#727272]"
            >
              <Link href={list.link} className="text-[14px] cursor-pointer">
                {list.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
