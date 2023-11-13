import * as MailComposer from "expo-mail-composer";
import { getAllNotesByTopic, getTopicNameByID } from "./dataService";

export const exportTopicByEmail = async (topicId: number, receiverEmail: string): Promise<boolean> => {

  MailComposer.isAvailableAsync().then((result) => {
    if (!result) { //if email is not available (e.g. on ios if app is not set up)
      return false;
    }
  });

  try {
    const notes = await getAllNotesByTopic(topicId);
    const topicName = await getTopicNameByID(topicId);

    // Group notes by date
    const groupedNotes: { [date: string]: string[] } = {};
    notes.forEach((note) => {
      console.log("ni")
      console.log(JSON.stringify(note))
      const date = note.date;
      if (!groupedNotes[date]) {
        groupedNotes[date] = [];
      }
      groupedNotes[date].push(note.message);
    });
    
    // Create HTML email body
    let emailBody = "";
    for (const date in groupedNotes) {
      emailBody += `<h2>${date}</h2><ul>`;
      groupedNotes[date].forEach((message) => {
        emailBody += `<li>- ${message}</li>`;
      });
      emailBody += `</ul>`;
    }

    const email = {
      subject: `Notes for ${topicName}`,
      recipients: [receiverEmail],
      body: emailBody,
      isHtml: true,
    };

    await MailComposer.composeAsync(email);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
};
