import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

export interface Note {
  message: string;
  date: string;
  topicId: number;
  noteId?: number;
}

export interface Topic {
  topicId: number;
  name: string;
  isCurrent?: number;
}

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}



const db = openDatabase();

export const initDB = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS topics (
                    topicId INTEGER PRIMARY KEY,
                    name TEXT UNIQUE
                )`
        );
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS notes (
                    noteId INTEGER PRIMARY KEY,
                    message TEXT,
                    date TEXT,
                    topicId INTEGER
                )`
        );
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS activeTopics (
                      activeTopicId INTEGER PRIMARY KEY,
                      topicId INTEGER UNIQUE,
                      isCurrent INTEGER
                  )`
          );
        tx.executeSql(
            `CREATE TABLE IF NOT EXISTS email (
                      emailId INTEGER PRIMARY KEY,
                      email TEXT UNIQUE
                  )`
          );
      });
      console.log("finish db")
      resolve();
    } catch (error) {
      console.error("Error initializing database:", error);
      reject(error);
    }
  });
};

export const deleteDB = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      db.transaction((tx) => {
        tx.executeSql(
          `DROP TABLE topics`
        );
        tx.executeSql(
          `DROP TABLE notes`
        );
        tx.executeSql(
            `DROP TABLE activeTopics`
          );
        tx.executeSql(
            `DROP TABLE email`
          );
      });

      resolve();
    } catch (error) {
      console.error("Error initializing database:", error);
      reject(error);
    }
  });
}

export const addTopic = (topicName: string): Promise<Topic> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          "INSERT INTO topics (name) VALUES (?)",
          [topicName],
          (_, results) => {
            if (results.rowsAffected > 0) {
              resolve({ topicId: results.insertId as number, name: topicName });
            } else {
              reject(new Error("No rows affected. Topic was not added."));
            }
          },
          (_, error) => {
            console.error("Error adding topic:", error);
            if (error && error.code === 6) {
              // SQLite constraint error code
              reject(new Error("Topic name already exists."));
            } else {
              reject(error);
            }
            return false;
          }
        );
      },
      (transactionError) => {
        console.error("Transaction error:", transactionError);
        reject(transactionError);
      }
    );
  });
};

export const getAllTopics = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM topics",
        [],
        (_, results) => {
          let topics: Topic[] = [];
          for (let i = 0; i < results.rows.length; i++) {
            topics.push(results.rows.item(i));
          }
          resolve(topics);
        },
        (_, error) => {
          console.error("Error fetching topics:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const addNote = async (note: Note): Promise<Note> => {
  // Check if the topic exists
  const topicExists = await checkTopicExistsById(note.topicId);
  if (!topicExists) {
    throw new Error(`Topic with id ${note.topicId} does not exist`);
  }

  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          "INSERT INTO notes (message, date, topicId) VALUES (?, ?, ?)",
          [note.message, note.date, note.topicId],
          (_, results) => {
            if (results.rowsAffected > 0) {
              resolve({ noteId: results.insertId as number, ...note });
            } else {
              reject(new Error("No rows affected. Note was not added."));
            }
          },
          (_, error) => {
            console.error("Error adding note:", error);
            reject(error);
            return false;
          }
        );
      },
      (transactionError) => {
        console.error("Transaction error:", transactionError);
        reject(transactionError);
      }
    );
  });
};

export const getAllNotesByTopic = (topicId: number): Promise<Note[]> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM notes WHERE topicId = ?",
        [topicId],
        (_, results) => {
          let notes: Note[] = [];
          for (let i = 0; i < results.rows.length; i++) {
            notes.push(results.rows.item(i));
          }
          resolve(notes);
        },
        (_, error) => {
          console.error("Error fetching notes:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const deleteTopicAndNotesById = (topicId: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM notes WHERE topicId = ?`,
        [topicId],
        (_, result) => {
            console.log(`Deleted ${result.rowsAffected} notes`);
        },
        (_, error) => {
          console.error("Error deleting notes:", error);
          reject(error);
          return false;
        }
      );

      tx.executeSql(
        `DELETE FROM topics WHERE topicId = ?`,
        [topicId],
        (_, result) => {
          console.log(`Deleted ${result.rowsAffected} topic`);
          resolve();
        },
        (_, error) => {
          console.error("Error deleting topic:", error);
          reject(error);
          return false;
        }
      );
    });
  });
};

export const checkTopicExistsById = async (
  topicId: number
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM topics WHERE topicId = ?",
        [topicId],
        (_, results) => {
          resolve(results.rows.length > 0);
        },
        (_, error) => {
          console.error("Error fetching topic:", error);
          reject(error);
          return false;
        }
      );
    }
    );
  });
};

export const saveActiveTopics = (topics: Topic[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
        tx.executeSql(
            `DELETE FROM activeTopics`,
            [],
            (_, result) => {
                console.log(`Deleted ${result.rowsAffected} active topics`);
                resolve()
            },
            (_, error) => {
            console.error("Error deleting active topics:", error);
            reject(error);
            return false;
            }
        );
    
        topics.forEach((topic, i) => {
            tx.executeSql(
            `INSERT INTO activeTopics (topicId, isCurrent) VALUES (?, ?)`,
            [topic.topicId, i === 0 ? 1 : 0],
            (_, result) => {
                console.log(`Inserted ${topic.name} at index ${i}`);
                resolve();
            },
            (_, error) => {
                console.error("Error inserting active topic:", error);
                reject(error);
                return false;
            }
            );
        });
        });
    });
    }

export const getActiveTopics = async(): Promise<Topic[]> => {

    await initDB();

    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
        tx.executeSql(
          `SELECT t.* FROM topics t JOIN activeTopics a ON t.topicId = a.topicId ORDER BY a.isCurrent DESC`,
            [],
            (_, results) => {
            let topics: Topic[] = [];
            for (let i = 0; i < results.rows.length; i++) {
                topics.push(results.rows.item(i));
            }
            
            topics.sort((a, b) => {
              if (a.isCurrent === b.isCurrent) {
                return 0;
              } else if (a.isCurrent) {
                return -1;
              } else {
                return 1;
              }
            });

            resolve(topics);
            },
            (_, error) => {
            console.error("Error fetching active topics:", error);
            reject(error);
            return false;
            }
        );
        });
    });
    }


    export function getTopicNameByID (topicId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            db.transaction((tx) => {
            tx.executeSql(
                `SELECT name FROM topics WHERE topicId = ?`,
                [topicId],
                (_, results) => {
                    resolve(results.rows.item(0).name);
                },
                (_, error) => {
                console.error("Error fetching topic name:", error);
                reject(error);
                return false;
                }
            );
            });
        });
    }

  export function getEmail (): Promise<string> {
    return new Promise((resolve, reject) => {
        db.transaction((tx) => {
        tx.executeSql(
            `SELECT * FROM email`,
            [],
            (_, results) => {
              if (results.rows.length === 0) {
                console.log(JSON.stringify(results.rows))
                resolve("")
              }
              else {
                console.log(JSON.stringify(results.rows))
                resolve(results.rows.item(0).email);
              }
                
            },
            (_, error) => {
              console.error("Error fetching email:", error);
              reject(error);
              return false;
            }
        );
        });
    });
  }


 export const saveEmail = (email: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
    db.transaction(
        (tx) => {
          console.log("in txxe")
          tx.executeSql(
            "REPLACE INTO email (emailId, email) VALUES (?, ?)",
            [1, email],
            (_, results) => {
              console.log("hhh")
              console.log("hdakjsdh", results)
              if (results.rowsAffected > 0) {
                console.log("jsjsjsj")
                resolve("hi");
                
              } else {
                console.log("asdkklajsdjs")
                reject(new Error("No rows affected. Email was not added."));
              }
            },
            (_, error) => {
              console.error("Error adding email:", error);
              reject(error);
              return false;
            }
          );
        },
        (transactionError) => {
          console.error("Transaction error:", transactionError);
          reject(transactionError);
        }
      );
    }  catch (error) {
      console.error("Error initializing database:", error);
      reject(error);
    }
    });
  }