/// <reference path="loggers/ilogger.ts" />

let HBTemplates: any;

namespace HTML5AudioPlayer {
    export let APP_MODE: string = "debug";
    export let APP_VERSION: string = "V1.1";
    export let LOGGING_ENABLED: boolean = true;
    export let LOGGING_LEVEL: Utilities.Logging.LogLevel = Utilities.Logging.LogLevel.warn;
    export let UNLOCK_AUDIOS: boolean = false;
}

namespace HTML5AudioPlayer.DataStructures {

    export const Defaults = {
        UpdateInterval: 2
    };

    export class AppConfig {
        mode: string;
        language: string;
        resources: string;
        version: string;
        logging: LogConfig;
        apisrelease: APIUrls;
        apisdebug: APIUrls;
        visuallog: boolean;
    }

    export class LogConfig {
        enabled: boolean;
        level: Utilities.Logging.LogLevel;
        logger: string;
        options: Utilities.Logging.LoggerOptions;
    }

    export class APIUrls {
        coursedata: string;
    }

    export enum CourseMode {
        OPEN = "open",
        NONCPE = "non-cpe",
        CPE = "cpe"
    }

    export enum CompleteOn {
        LAUNCH = "launch",
        COMPLETE = "complete"
    }

    export class ModalButton {
        id: string;
        name: string;
        isHidden: boolean;
    }

    export class ModalDialogOptions {
        heading: string;
        content: string;
        hasclose: boolean;
        hasProgressbar?: boolean;
        progressTitle?: string;
        buttons?: ModalButton[];
        reportCategory?: string;
    }

    export class VideoMessages {
        nosupport: string;
        loading: string;
        seeking: string;
        failTitle: string;
        failMessage: string;
        buttons: ModalButton[];
    }

    export class PlayerData {
        progressinterval: number;
        messages: VideoMessages;
        completiondelta: number;
        playlist: AudioData[];
        options: options[];
        kcList : kcDate[]
        //slides : Carousel;
        ScormPreviousData: any;
        coursemode: CourseMode;
        commlostmsg: string;
        passingPercent: number;
    }
    export class options {
        playbackRates: [];
    }

    export class kcDate {
    }

    export class AudioData {
        id: string;
        title: string;
        description: string;
        url: string;
        subtitle: string;
        preview: string;
        thumbnail: string;
        duration: number;
        currenttime: number;
        complete: boolean;
        kccomplete: boolean;
        current: boolean;
        disabled: boolean;
        isAssessment: boolean;
        isSurvey: boolean;
        hiddenInPlaylist: boolean;
        hasQuestion:boolean;
        quesDescription: string;
        microPolls: MicroPoll[];
        numQuestions:number;
        currentClicked:boolean;
    }

    export class kcListData {
        id: string;
        title: string;
        description: string;
        subtitle: string;
        thumbnail: string;
        currenttime: number;
        complete: boolean;
        current: boolean;
        disabled: boolean;
        isAssessment: boolean;
        hiddenInPlaylist: boolean;
        hasQuestion:boolean;
        quesDescription: string;
        numQuestions:number;
    }

    export class AudioScormData {
        t: number; // max visited time
        c: number; // Audio complete status (0-not, 1-complete)
        k: number; // KC complete status (0-not, 1-complete)
        n: number; // number of KC present in the audio;
    }

    export enum KCType {
        MCSS = "mcss",
        MCMS = "mcms"
    }

    export enum KCWhen {
        Start = -2,
        End = -1
    }

    export enum KCResult {
        Correct = "correct",
        Incorrect = "incorrect",
        Partial = "partial"
    }

    export class KCOption {
        id: string;
        text: string;
        feedback: string;
    }

    export class KCGenFeedback {
        correct: string;
        incorrect: string;
        partial: string;
    }

    export class KCIndividualFeedback {
        id: string;
        feedback: string;
    }

    export enum KCFeedbackType {
        Individual = "individual",
        Generic = "generic"
    }

    export class KCFeedback {
        title: string;
        type: KCFeedbackType;
        generic: KCGenFeedback;
        individual: KCIndividualFeedback[];
    }

    export class CuePoint {
        id: string;
        audio: string;
        time: number;
        triggered: boolean;
        visited:boolean;
    }

    export class KCData {
        id: string;
        audio: string;
        time: string;
        question: string;
        instruction: string;
        type: KCType;
        attempts: number;
        correct: string[];
        options: KCOption[];
        feedback: KCFeedback;
        submit: string;
        continue: string;
        tryagain: string;
        next: string;
        inputtype: string;
        usedattempts: number;
        index:number;
        total:number;
    }

    export class PlaylistItemData {
        "id": string;
        "title": string;
        "description": string;
        "url": string;
        "subtitle": string;
        "preview": string;
        "thumbnail": string;
        "duration": string;
    }

    export class MicroPoll {
        id: string;
        time: string;
        url: string;
        pause: boolean;

        opened: boolean;
    }

    export class HelpData {
        show: boolean;
        tooltip: string;
        icon: string;
        url: string;
    }

    export class startPage {
        title: string;
        content: string;
        successText: string;
        button: string;
    }

    export class resultPage {
        pageTitle: string;
        ResultText: string;
        ScoreText: string;
        PassText: PassText;
        FailText: FailText;
        AssessmentCloseText: string;
    }

    export class PassText {
        congratsText: string;
        InstructionText: string;
        scoreLabel: string;
    }

    export class FailText {
        FailSubTitle: string;
        scoreLabel: string;
        Retake: Retake;
        infoText: string;
    }

    export class Retake {
        RetakeInstructionText: string;
        RetakeButtonLabel: string;
    }

    export class AssessmentData {
        module: ModuleData[];

    }



    export class ModuleData {
        moduleID: string;
        pool: PoolData;
    }
    export class PoolData {
        bank: BankData[];
    }
    export class BankData {
        bankId: string;
        numQuesToDisplay: string;
        isRandomize: string;
        question: AQData[];
    }

    export class AQData {
        id: string;
        type: KCType;
        body: AQBody;
    }

    export class AQBody {
        question: string;
        instruction: string;
        MCQ: MCQData

    }
    export class MCQData {
        category: string;
        totalAttempts: string;
        randomizeOptions: string;
        correctAnswer: string;
        choices: Choices;
        button: ButtonData[];
    }

    export class Choices {
        choice: ChoiceData[];
    }

    export class ChoiceData {
        correct: string;
        "cdata-section": string;
    }
    export class ButtonData {
        submit: string;
        back: string;
    }

    export enum ADType {
        MCSS = "MCSS",
        MCMS = "MCMS"
    }
    export class AssessmentScormData {
        score: number;
        status: string;
    }

    export class SurveyScormData {
        completed: boolean;
        answers?: object;
    }

    export class SurveyQuestionResponse {
        questionId: string;
        questionType: ADType;
        question: string;
        answer: string;
    }

    export class Carousel{
		hasCarousel:boolean;
        slides: slideData[];
    }
    export class slideData {
        id: string;
        title: string;
        description: string;
        preview: string;
        subtitle: string;
        current: boolean;
        disabled: boolean;
        // microPolls: MicroPoll[];
    }
}