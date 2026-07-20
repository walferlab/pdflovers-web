import NotFoundImg from "@/public/404.png";
import Image from "next/image";
import Link from "next/link";

export default function NotFound () {
    return(
        <div className="flex flex-col justify-center items-center gap-4 p-4 sm:p-2">
            <Image src={NotFoundImg} alt="Not found" width={400} height={400} style={{ height: "auto" }} />
            <p className="text-md sm:text-lg text-black/90 font-medium font-general text-center">Shoo, human! Wrong page. Fix your link and get lost, I'm busy making art</p>
            <Link href="/" className="text-md text-blue-500/90 font-general font-medium underline underline-offset-2">Go back</Link>
        </div>
    )
}