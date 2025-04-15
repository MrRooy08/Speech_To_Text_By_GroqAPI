import AudioUploader  from "../components/AudioUploader";    

export default function Home() {

  return (
    <main className=" bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800
    flex flex-col items-center justify-center min-h-screen py-2">
      <AudioUploader />
    </main>
  );
};