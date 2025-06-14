import { AppDataSource } from "./data-source";


const initApplication = async () => {
    try{
        await AppDataSource.initialize();
    } catch (error) {
        console.error("Error initializing application:", error);
        process.exit(1);
    }
    console.log("Application initialized successfully.");
}

export default initApplication;